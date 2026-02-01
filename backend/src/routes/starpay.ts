import express, { Request, Response } from 'express';
import { starpayService } from '../services/starpayService.js';
import { verifyDevnetPayment } from '../services/paymentService.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

router.post('/cards/order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, cardType, email } = req.body;

    if (!amount || !cardType || !email) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, cardType, email'
      } as ApiResponse);
      return;
    }

    if (amount < 5 || amount > 10000) {
      res.status(400).json({
        success: false,
        error: 'Amount must be between $5 and $10,000'
      } as ApiResponse);
      return;
    }

    if (!['visa', 'mastercard'].includes(cardType)) {
      res.status(400).json({
        success: false,
        error: 'Card type must be "visa" or "mastercard"'
      } as ApiResponse);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: 'Invalid email address'
      } as ApiResponse);
      return;
    }

    const order = await starpayService.createCardOrder({
      amount: parseFloat(amount),
      cardType,
      email
    });

    logger.info(`🎴 Starpay order created: ${order.orderId}`);

    try {
      const CardOrder = (await import('../models/CardOrder.js')).default;
      
      await CardOrder.create({
        orderId: order.orderId,
        walletAddress: req.body.walletAddress || null,
        amount: order.pricing.cardValue,
        cardType,
        email,
        status: 'pending',
        paymentAddress: order.payment.address,
        amountSol: order.payment.amountSol,
        expiresAt: order.expiresAt
      });
      
      logger.info(`💾 Card order saved to database: ${order.orderId}`);
    } catch (dbError: any) {
      logger.error('❌ Failed to save card order to DB:', dbError);
    }

    res.status(201).json({
      success: true,
      data: order,
      message: 'Card order created successfully. Please send payment to complete.'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('❌ Card order creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create card order'
    } as ApiResponse);
  }
});

router.post('/cards/verify-payment/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { signature } = req.body;

    if (!signature) {
      res.status(400).json({
        success: false,
        error: 'Transaction signature required'
      } as ApiResponse);
      return;
    }

    logger.info(`🔐 Verifying payment for card order: ${orderId}`);

    const CardOrder = (await import('../models/CardOrder.js')).default;
    const order = await CardOrder.findOne({ orderId });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      } as ApiResponse);
      return;
    }

    if (order.status === 'completed') {
      res.status(400).json({
        success: false,
        error: 'Order already completed'
      } as ApiResponse);
      return;
    }

    // ✅ DEMO MODE: Skip strict payment verification
    const IS_DEMO = process.env.SOLANA_NETWORK === 'devnet' || process.env.NODE_ENV === 'development';
    
    let verification;
    if (IS_DEMO) {
      // In demo mode, just verify transaction exists on blockchain
      logger.info('🎭 Demo mode: Simplified verification (checking tx exists)');
      
      const { getSolanaConnection } = await import('../config/solana.js');
      const connection = getSolanaConnection();
      
      try {
        const tx = await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
        
        if (!tx || tx.meta?.err) {
          verification = { verified: false, error: 'Transaction not found or failed' };
        } else {
          verification = { verified: true, amountSol: order.amountSol };
          logger.info('✅ Demo verification: Transaction exists on blockchain');
        }
      } catch (error) {
        verification = { verified: false, error: 'Failed to fetch transaction' };
      }
    } else {
      // Production: Full strict verification
      verification = await verifyDevnetPayment(
        signature,
        order.amountSol,
        order.paymentAddress
      );
    }

    if (!verification.verified) {
      logger.error(`❌ Payment verification failed: ${verification.error}`);
      res.status(400).json({
        success: false,
        error: verification.error || 'Payment verification failed'
      } as ApiResponse);
      return;
    }

    logger.info(`✅ Payment verified for order: ${orderId}`);

    order.status = 'processing';
    order.transactionSignature = signature;
    await order.save();

    try {
      const completedOrder = await starpayService.completeCardOrder(orderId);
      
      order.status = 'completed';
      order.cardDetails = completedOrder.card;
      await order.save();

      logger.info(`🎉 Card issued for order: ${orderId}`);

      try {
        const emailService = (await import('../services/emailService.js')).emailService;
        await emailService.sendCardIssuedNotification(order.email, {
          orderId: order.orderId,
          cardValue: order.amount,
          cardType: order.cardType
        });
        logger.info(`📧 Card notification sent to ${order.email}`);
      } catch (emailError) {
        logger.error('❌ Failed to send email:', emailError);
      }

      res.json({
        success: true,
        data: {
          orderId: order.orderId,
          status: order.status,
          verified: true,
          card: completedOrder.card
        },
        message: 'Payment verified and card issued successfully!'
      } as ApiResponse);

    } catch (cardError: any) {
      logger.error('❌ Card issuance failed:', cardError);
      res.status(500).json({
        success: false,
        error: 'Payment verified but card issuance failed'
      } as ApiResponse);
    }

  } catch (error: any) {
    logger.error('❌ Payment verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Payment verification failed'
    } as ApiResponse);
  }
});

router.get('/cards/status/:orderId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'Order ID is required'
      } as ApiResponse);
      return;
    }

    logger.info(`🔍 Checking status for order: ${orderId}`);

    const CardOrder = (await import('../models/CardOrder.js')).default;
    const dbOrder = await CardOrder.findOne({ orderId });

    if (dbOrder && dbOrder.status === 'completed') {
      res.json({
        success: true,
        data: {
          orderId: dbOrder.orderId,
          status: dbOrder.status,
          card: dbOrder.cardDetails,
          createdAt: dbOrder.createdAt,
          updatedAt: dbOrder.updatedAt,
          isMock: true
        }
      } as ApiResponse);
      return;
    }

    const status = await starpayService.checkOrderStatus(orderId);

    res.json({
      success: true,
      data: status
    } as ApiResponse);
  } catch (error: any) {
    logger.error('❌ Check order status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check order status'
    } as ApiResponse);
  }
});

router.get('/cards/price', async (req: Request, res: Response): Promise<void> => {
  try {
    const amount = parseFloat(req.query.amount as string);

    if (!amount || isNaN(amount)) {
      res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      } as ApiResponse);
      return;
    }

    if (amount < 5 || amount > 10000) {
      res.status(400).json({
        success: false,
        error: 'Amount must be between $5 and $10,000'
      } as ApiResponse);
      return;
    }

    const pricing = await starpayService.getCardPrice(amount);

    res.json({
      success: true,
      data: pricing
    } as ApiResponse);
  } catch (error: any) {
    logger.error('❌ Get card price error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get card pricing'
    } as ApiResponse);
  }
});

router.get('/status', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: {
      enabled: starpayService.isServiceEnabled(),
      mockMode: starpayService.isMockMode()
    }
  } as ApiResponse);
});

export default router;