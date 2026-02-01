import express, { Request, Response } from 'express';
import CardTransaction from '../models/CardTransaction.js';
import CardOrder from '../models/CardOrder.js';
import { v4 as uuid } from 'uuid';
import { logger } from '../utils/logger.js';
import { ApiResponse } from '../types/index.js';

const router = express.Router();

/**
 * Get card balance (sum of all transactions)
 * GET /api/card/:cardOrderId/balance
 */
router.get('/:cardOrderId/balance', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardOrderId } = req.params;

    // Verify card exists
    const card = await CardOrder.findOne({ orderId: cardOrderId });
    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' } as ApiResponse);
      return;
    }

    // Sum all completed transactions
    const transactions = await CardTransaction.find({ 
      cardOrderId, 
      status: 'completed' 
    });

    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      success: true,
      data: {
        cardOrderId,
        balance: Number(balance.toFixed(2)),
        currency: 'USD'
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Get card balance error:', error);
    res.status(500).json({ success: false, error: 'Failed to get balance' } as ApiResponse);
  }
});

/**
 * Get card transactions
 * GET /api/card/:cardOrderId/transactions
 */
router.get('/:cardOrderId/transactions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardOrderId } = req.params;
    const { limit = 50 } = req.query;

    const transactions = await CardTransaction.find({ cardOrderId })
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      data: transactions
    } as ApiResponse);
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get transactions' } as ApiResponse);
  }
});

/**
 * Add top-up transaction
 * POST /api/card/:cardOrderId/topup
 */
router.post('/:cardOrderId/topup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardOrderId } = req.params;
    const { amount, walletAddress } = req.body;

    console.log('💳 Top up request:', { cardOrderId, amount, walletAddress });

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid amount' } as ApiResponse);
      return;
    }

    // Verify card exists - try orderId first, then _id
    let card = await CardOrder.findOne({ orderId: cardOrderId });
    if (!card) {
      console.log('⚠️ Card not found by orderId, trying by _id');
      try {
        card = await CardOrder.findById(cardOrderId);
      } catch (e) {
        // Invalid ObjectId format, ignore
      }
    }
    
    if (!card) {
      console.error('❌ Card not found:', cardOrderId);
      const allCards = await CardOrder.find({}).select('orderId');
      console.log('🔍 Available cards:', allCards.map(c => c.orderId));
      res.status(404).json({ success: false, error: 'Card not found' } as ApiResponse);
      return;
    }

    console.log('✅ Card found:', card.orderId);

    // Create top-up transaction
    const transaction = await CardTransaction.create({
      transactionId: `tx_${uuid()}`,
      cardOrderId: card.orderId, // ✅ Use card.orderId not cardOrderId from params
      walletAddress: walletAddress || card.walletAddress,
      type: 'topup',
      merchant: 'Card Funding',
      amount: Number(amount),
      status: 'completed'
    });

    logger.info(`Card top-up: ${card.orderId} +$${amount}`);

    // Calculate new balance
    const allTransactions = await CardTransaction.find({ 
      cardOrderId: card.orderId,
      status: 'completed'
    });
    
    const newBalance = allTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    res.status(201).json({
      success: true,
      data: {
        transaction,
        balance: Number(newBalance.toFixed(2))
      },
      message: 'Top-up successful'
    } as ApiResponse);
  } catch (error) {
    logger.error('Top-up error:', error);
    res.status(500).json({ success: false, error: 'Failed to process top-up' } as ApiResponse);
  }
});

/**
 * Add withdrawal transaction
 * POST /api/card/:cardOrderId/withdraw
 */
router.post('/:cardOrderId/withdraw', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardOrderId } = req.params;
    const { amount, walletAddress } = req.body;

    console.log('💳 Withdraw request:', { cardOrderId, amount, walletAddress });

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Invalid amount' } as ApiResponse);
      return;
    }

    // Verify card exists - try orderId first, then _id
    let card = await CardOrder.findOne({ orderId: cardOrderId });
    if (!card) {
      try {
        card = await CardOrder.findById(cardOrderId);
      } catch (e) {
        // Invalid ObjectId format, ignore
      }
    }

    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' } as ApiResponse);
      return;
    }

    // Check balance
    const transactions = await CardTransaction.find({ 
      cardOrderId: card.orderId,
      status: 'completed' 
    });
    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    if (amount > balance) {
      res.status(400).json({ success: false, error: 'Insufficient balance' } as ApiResponse);
      return;
    }

    // Create withdrawal transaction (negative amount)
    const transaction = await CardTransaction.create({
      transactionId: `tx_${uuid()}`,
      cardOrderId: card.orderId, // ✅ Use card.orderId
      walletAddress: walletAddress || card.walletAddress,
      type: 'withdrawal',
      merchant: 'Withdrawal to Wallet',
      amount: -Number(amount),
      status: 'completed'
    });

    const newBalance = balance - amount;

    logger.info(`Card withdrawal: ${card.orderId} -$${amount}`);

    res.status(201).json({
      success: true,
      data: {
        transaction,
        balance: Number(newBalance.toFixed(2))
      },
      message: 'Withdrawal successful'
    } as ApiResponse);
  } catch (error) {
    logger.error('Withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Failed to process withdrawal' } as ApiResponse);
  }
});


/**
 * Starpay webhook - Record card purchases
 * POST /api/card/webhook/starpay
 */
router.post('/webhook/starpay', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, transaction } = req.body;

    // In production, verify webhook signature from Starpay
    // For mock, we'll just process it

    logger.info('Starpay webhook received:', { orderId, transaction });

    // Find card order
    const card = await CardOrder.findOne({ orderId });
    if (!card) {
      logger.warn(`Webhook for unknown card: ${orderId}`);
      res.status(404).json({ success: false, error: 'Card not found' } as ApiResponse);
      return;
    }

    // Create purchase transaction
    const cardTransaction = await CardTransaction.create({
      transactionId: `tx_${uuid()}`,
      cardOrderId: orderId,
      walletAddress: card.walletAddress,
      type: 'purchase',
      merchant: transaction.merchant || 'Unknown Merchant',
      amount: -Math.abs(Number(transaction.amount)), // Negative for purchases
      status: transaction.status || 'completed',
      metadata: {
        merchantCategory: transaction.category,
        location: transaction.location,
        starpayTxId: transaction.id
      }
    });

    logger.info(`Card purchase recorded: ${orderId} -$${Math.abs(transaction.amount)} at ${transaction.merchant}`);

    res.json({
      success: true,
      data: cardTransaction,
      message: 'Transaction recorded'
    } as ApiResponse);
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ success: false, error: 'Webhook processing failed' } as ApiResponse);
  }
});

/**
 * MOCK: Simulate a card purchase (for testing without real Starpay)
 * POST /api/card/:cardOrderId/mock-purchase
 */
router.post('/:cardOrderId/mock-purchase', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cardOrderId } = req.params;
    const { merchant, amount, status = 'completed' } = req.body;

    const card = await CardOrder.findOne({ orderId: cardOrderId });
    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' } as ApiResponse);
      return;
    }

    // Check balance
    const transactions = await CardTransaction.find({ 
      cardOrderId: card.orderId,
      status: 'completed' 
    });
    const balance = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    if (amount > balance && status === 'completed') {
      // Insufficient balance - create failed transaction
      const failedTx = await CardTransaction.create({
        transactionId: `tx_${uuid()}`,
        cardOrderId: card.orderId,
        walletAddress: card.walletAddress,
        type: 'purchase',
        merchant: merchant || 'Test Merchant',
        amount: -Math.abs(Number(amount)),
        status: 'failed'
      });

      logger.info(`🎭 Mock purchase FAILED (insufficient funds): ${card.orderId} -$${amount} at ${merchant}`);

      res.status(201).json({
        success: true,
        data: failedTx,
        message: 'Mock purchase failed (insufficient balance)'
      } as ApiResponse);
      return;
    }

    // Create purchase transaction
    const transaction = await CardTransaction.create({
      transactionId: `tx_${uuid()}`,
      cardOrderId: card.orderId,
      walletAddress: card.walletAddress,
      type: 'purchase',
      merchant: merchant || 'Test Merchant',
      amount: -Math.abs(Number(amount)),
      status
    });

    logger.info(`🎭 Mock purchase created: ${card.orderId} -$${amount} at ${merchant} (${status})`);

    res.status(201).json({
      success: true,
      data: transaction,
      message: 'Mock purchase created'
    } as ApiResponse);
  } catch (error) {
    logger.error('Mock purchase error:', error);
    res.status(500).json({ success: false, error: 'Failed to create mock purchase' } as ApiResponse);
  }
});

export default router;