// backend/src/services/paymentService.ts

// backend/src/services/paymentService.ts
// FIX: The amount calculation is wrong - it's using wrong balance indices

import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { logger } from '../utils/logger.js';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

export interface PaymentVerificationResult {
  verified: boolean;
  amountSol?: number;
  error?: string;
}

/**
 * Verify a Solana devnet payment transaction
 */
export async function verifyDevnetPayment(
  signature: string,
  expectedAmount: number,
  recipientAddress: string
): Promise<PaymentVerificationResult> {
  try {
    logger.info(`🔍 Verifying devnet transaction: ${signature}`);
    logger.info(`💰 Expected amount: ${expectedAmount} SOL`);
    logger.info(`📬 Expected recipient: ${recipientAddress}`);

    // Get transaction details from blockchain
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0
    });

    if (!tx) {
      logger.error('❌ Transaction not found on blockchain');
      return { verified: false, error: 'Transaction not found' };
    }

    if (!tx.meta) {
      logger.error('❌ Transaction metadata not available');
      return { verified: false, error: 'Transaction metadata unavailable' };
    }

    // Check if transaction succeeded
    if (tx.meta.err) {
      logger.error('❌ Transaction failed:', tx.meta.err);
      return { verified: false, error: 'Transaction failed' };
    }

    // ✅ FIX: Get the recipient's public key and find their balance change
    const recipientPubkey = new PublicKey(recipientAddress);
    const accountKeys = tx.transaction.message.getAccountKeys();
    
    // Find recipient index in the transaction
    const recipientIndex = accountKeys.staticAccountKeys.findIndex(key => 
      key.equals(recipientPubkey)
    );

    if (recipientIndex === -1) {
      logger.error('❌ Recipient not found in transaction');
      return { verified: false, error: 'Recipient not found in transaction' };
    }

    // ✅ FIX: Calculate amount received by recipient (not sender's spent amount)
    const recipientPreBalance = tx.meta.preBalances[recipientIndex] || 0;
    const recipientPostBalance = tx.meta.postBalances[recipientIndex] || 0;
    const amountLamports = recipientPostBalance - recipientPreBalance;
    const amountSol = amountLamports / LAMPORTS_PER_SOL;

    logger.info(`💸 Recipient received: ${amountSol} SOL (${amountLamports} lamports)`);
    logger.info(`💸 Transaction fee: ${(tx.meta.fee || 0) / LAMPORTS_PER_SOL} SOL`);

    // Verify amount (with tolerance for rounding)
    const tolerance = 0.001;
    const amountDiff = Math.abs(amountSol - expectedAmount);
    
    if (amountDiff > tolerance) {
      logger.error(`❌ Amount mismatch! Expected: ${expectedAmount}, Got: ${amountSol}, Diff: ${amountDiff}`);
      return { 
        verified: false, 
        error: `Amount mismatch. Expected ${expectedAmount} SOL, got ${amountSol} SOL`,
        amountSol 
      };
    }

    logger.info('✅ Payment verified successfully!');
    return { verified: true, amountSol };

  } catch (error: any) {
    logger.error('❌ Payment verification error:', error);
    return { 
      verified: false, 
      error: error.message || 'Verification failed' 
    };
  }
}

/**
 * Check if we're in mock/development mode
 */
export function isMockMode(): boolean {
  const network = process.env.SOLANA_NETWORK || 'devnet';
  const nodeEnv = process.env.NODE_ENV || 'development';
  return network === 'devnet' || nodeEnv === 'development';
}

/**
 * Get Solana connection
 */
export function getSolanaConnection(): Connection {
  return connection;
}

/**
 * Get current SOL price (mock for devnet)
 */
export function getMockSolPrice(): number {
  return parseFloat(process.env.MOCK_SOL_PRICE || '188');
}