import { Request, Response } from 'express';
import { getSolanaConnection } from '../config/solana.js';
import Product from '../models/Product.js';
import PaymentIntent from '../models/PaymentIntent.js';
import Order from '../models/Order.js';
import Storefront from '../models/Storefront.js';
import { v4 as uuid } from 'uuid';
import { generateOrderId, generateDownloadToken } from '../utils/idGenerator.js';
import { hashWallet } from '../utils/crypto.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { privacyCashService } from '../services/privacyCashService.js';

/**
 * Verify Solana transaction
 */
export const verifyTransaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { txSignature } = req.body;

    if (!txSignature) {
      res.status(400).json({
        success: false,
        error: 'Transaction signature required'
      } as ApiResponse);
      return;
    }

    const connection = getSolanaConnection();

    // Fetch transaction from blockchain
    const transaction = await connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!transaction) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      } as ApiResponse);
      return;
    }

    // Verify transaction was successful
    if (transaction.meta?.err) {
      res.status(400).json({
        success: false,
        error: 'Transaction failed on-chain'
      } as ApiResponse);
      return;
    }

    logger.info(`Transaction verified: ${txSignature}`);

    res.json({
      success: true,
      data: {
        verified: true,
        txSignature,
        blockTime: transaction.blockTime,
        slot: transaction.slot
      },
      message: 'Transaction verified successfully'
    } as ApiResponse);
  } catch (error) {
    logger.error('Verify transaction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify transaction'
    } as ApiResponse);
  }
};

/**
 * Create payment intent
 */
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, buyerWallet } = req.body;

    if (!productId) {
      res.status(400).json({
        success: false,
        error: 'Product ID required'
      } as ApiResponse);
      return;
    }

    // Get product details
    const product = await Product.findOne({ productId, isActive: true });
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ApiResponse);
      return;
    }

    // Get store owner's wallet address
    const storefront = await Storefront.findOne({ storeId: product.storeId });
    
    if (!storefront) {
      res.status(404).json({
        success: false,
        error: 'Storefront not found'
      } as ApiResponse);
      return;
    }

    // Create and persist a payment intent (one-time use)
    const intentId = `intent_${uuid()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const intent = await PaymentIntent.create({
      intentId,
      productId: product.productId,
      buyerWallet: buyerWallet || undefined,
      amount: product.price,
      currency: product.currency,
      recipientAddress: storefront.walletAddress,
      expiresAt
    });

    logger.info(`Payment intent created: ${intentId} for product: ${productId}`);

    res.json({
      success: true,
      data: {
        intentId: intent.intentId,
        amount: intent.amount,
        currency: intent.currency,
        recipientAddress: intent.recipientAddress,
        expiresAt: intent.expiresAt
      },
      message: 'Payment intent created'
    } as ApiResponse);
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment intent'
    } as ApiResponse);
  }
};

/**
 * Confirm payment: verify txSignature, mark intent used, create order
 */
export const confirmPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { intentId, txSignature } = req.body;

    console.log('💳 Confirm payment request:', { intentId, txSignature: txSignature?.slice(0, 20) });

    if (!intentId || !txSignature) {
      res.status(400).json({ success: false, error: 'Missing intentId or txSignature' } as ApiResponse);
      return;
    }

    // ✅ FIX #1: Check if order already exists for this transaction
    const existingOrder = await Order.findOne({ txSignature });
    if (existingOrder) {
      console.log('✅ Order already exists for transaction:', txSignature);
      res.json({
        success: true,
        data: {
          orderId: existingOrder.orderId,
          downloadToken: existingOrder.downloadToken,
          status: existingOrder.status,
          alreadyProcessed: true
        },
        message: 'Order already created for this transaction'
      } as ApiResponse);
      return;
    }

    // Get the intent
    const intent = await PaymentIntent.findOne({ intentId });
    
    if (!intent) {
      res.status(404).json({ success: false, error: 'Payment intent not found' } as ApiResponse);
      return;
    }

    // Check if intent expired
    if (new Date() > intent.expiresAt) {
      res.status(400).json({ success: false, error: 'Payment intent expired' } as ApiResponse);
      return;
    }

    // ✅ FIX #2: If intent already has this transaction, look for order
    if (intent.txSignature === txSignature) {
      console.log('⚠️ Transaction already attached to intent');
      const order = await Order.findOne({ txSignature });
      if (order) {
        res.json({
          success: true,
          data: {
            orderId: order.orderId,
            downloadToken: order.downloadToken,
            status: order.status,
            alreadyProcessed: true
          },
          message: 'Order already created'
        } as ApiResponse);
        return;
      }
      // If no order found, continue to create it
      console.log('No order found, creating new order...');
    }

    // ✅ FIX #3: If intent used with different transaction, reject
    if (intent.used && intent.txSignature && intent.txSignature !== txSignature) {
      res.status(400).json({ 
        success: false, 
        error: 'Payment intent already used with different transaction' 
      } as ApiResponse);
      return;
    }

    // Verify the transaction on-chain
    console.log('🔍 Verifying transaction on blockchain...');
    const verify = await privacyCashService.verifyPaymentTransaction(txSignature, intent.recipientAddress);
    
    if (!verify.isValid) {
      console.error('❌ Transaction verification failed:', verify.error);
      res.status(400).json({ 
        success: false, 
        error: verify.error || 'Transaction verification failed' 
      } as ApiResponse);
      return;
    }

    console.log('✅ Transaction verified');

    // Mark intent as used (only if not already marked)
    if (!intent.used) {
      intent.used = true;
      intent.txSignature = txSignature;
      await intent.save();
    }

    // Get product
    const product = await Product.findOne({ productId: intent.productId });

    if (!product) {
      res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      } as ApiResponse);
      return;
    }

    // ✅ Check if we're in mock/development mode
    const IS_MOCK = process.env.SOLANA_NETWORK === 'devnet' || process.env.NODE_ENV === 'development';

    // Create order
    const orderId = generateOrderId();
    const downloadToken = generateDownloadToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const buyerHash = intent.buyerWallet ? hashWallet(intent.buyerWallet) : 'anonymous';

    const order = await Order.create({
      orderId,
      productId: intent.productId,
      storeId: product.storeId,
      buyerWalletHash: buyerHash,
      txSignature,
      amount: intent.amount,
      currency: intent.currency,
      // ✅ Auto-deliver in mock mode for demo
      status: IS_MOCK ? 'delivered' : 'confirmed',
      downloadedAt: IS_MOCK ? new Date() : undefined,
      escrowState: IS_MOCK ? 'ESCROW_RELEASED' : 'ESCROW_LOCKED',
      downloadToken,
      expiresAt
    });

    // ✅ DEMO MODE: Auto-release decryption key
    if (IS_MOCK) {
      order.keyReleased = true;
      order.keyReleasedAt = new Date();
      await order.save();
      console.log('🔓 Demo mode: Key auto-released for instant download');
    }
    
    console.log(`✅ Order created: ${orderId} - Status: ${order.status}`);

    // Update product stats
    await Product.findOneAndUpdate(
      { productId: intent.productId },
      { 
        $inc: { 
          'stats.sales': 1,
          'stats.revenue': product.price
        } 
      }
    );

    // Update storefront stats
    await Storefront.findOneAndUpdate(
      { storeId: product.storeId },
      { 
        $inc: { 
          'stats.totalSales': 1,
          'stats.totalRevenue': product.price
        } 
      }
    );

    logger.info(`Order created: ${orderId} for product ${product.productId}`);

    res.json({ 
      success: true, 
      data: { 
        orderId: order.orderId, 
        downloadToken: order.downloadToken,
        status: order.status
      }, 
      message: 'Payment confirmed and order created' 
    } as ApiResponse);

  } catch (error: any) {
    logger.error('❌ Confirm payment error:', error);
    console.error('Full error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to confirm payment' 
    } as ApiResponse);
  }
};

/**
 * Get transaction status
 */
export const getTransactionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { txSignature } = req.params;

    const connection = getSolanaConnection();
    
    // Get transaction status
    const status = await connection.getSignatureStatus(txSignature);

    if (!status || !status.value) {
      res.status(404).json({
        success: false,
        error: 'Transaction not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        txSignature,
        confirmationStatus: status.value.confirmationStatus,
        confirmations: status.value.confirmations,
        err: status.value.err,
        slot: status.value.slot
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Get transaction status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get transaction status'
    } as ApiResponse);
  }
};

/**
 * Estimate transaction fee
 */
export const estimateFee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount } = req.body;

    // Get recent blockhash for fee estimation
    const connection = getSolanaConnection();
    const { feeCalculator } = await connection.getRecentBlockhash();

    // Estimate fee (this is simplified)
    const estimatedFee = feeCalculator.lamportsPerSignature / 1e9; // Convert to SOL

    res.json({
      success: true,
      data: {
        amount: parseFloat(amount),
        estimatedFee,
        total: parseFloat(amount) + estimatedFee,
        currency: 'SOL'
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Estimate fee error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate fee'
    } as ApiResponse);
  }
};