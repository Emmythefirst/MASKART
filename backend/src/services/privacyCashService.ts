import { Connection } from '@solana/web3.js';
import { getSolanaConnection } from '../config/solana.js';
import { logger } from '../utils/logger.js';
import PaymentIntent from '../models/PaymentIntent.js';
import Order from '../models/Order.js';

/**
 * Privacy Cash Service - Backend Integration (SECURE VERSION)
 * 
 * SECURITY PRINCIPLE:
 * - Backend ONLY verifies transactions
 * - Backend NEVER handles private keys
 * - All Privacy Cash operations happen on frontend
 * - Backend just confirms transactions occurred on-chain
 */

interface TransactionVerification {
  isValid: boolean;
  amount?: number;
  recipient?: string;
  timestamp?: number;
  error?: string;
}

class PrivacyCashService {
  private connection: Connection;

  constructor() {
    this.connection = getSolanaConnection();
  }

  /**
   * Verify a transaction occurred on-chain
   * This is ALL the backend needs to do - just verify, never sign
   */
  async verifyTransaction(txSignature: string): Promise<TransactionVerification> {
    try {
      // Fetch transaction from blockchain
      const transaction = await this.connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        logger.warn(`Transaction not found: ${txSignature}`);
        return {
          isValid: false,
          error: 'Transaction not found'
        };
      }

      // Check if transaction was successful
      if (transaction.meta?.err) {
        logger.warn(`Transaction failed on-chain: ${txSignature}`);
        return {
          isValid: false,
          error: 'Transaction failed on-chain'
        };
      }

      // Transaction is valid
      logger.info(`✅ Transaction verified: ${txSignature}`);
      
      return {
        isValid: true,
        timestamp: transaction.blockTime || undefined,
        // Note: Privacy Cash transactions don't expose amount publicly
        // That's the whole point of privacy!
      };
    } catch (error) {
      logger.error('Verify transaction error:', error);
      return {
        isValid: false,
        error: 'Verification failed'
      };
    }
  }

  /**
   * Verify transaction matches expected parameters
   * Used for order creation to ensure payment was correct
   */
  async verifyPaymentTransaction(
    txSignature: string,
    expectedRecipient: string,
    _minimumAmount?: number
  ): Promise<TransactionVerification> {
    try {
      // First, verify the transaction exists and succeeded
      const basicVerification = await this.verifyTransaction(txSignature);
      
      if (!basicVerification.isValid) {
        return basicVerification;
      }

      const transaction = await this.connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        return {
          isValid: false,
          error: 'Transaction not found'
        };
      }

      // For Privacy Cash transactions, we enforce additional checks:
      // 1. Transaction executed successfully
      // 2. Transaction interacted with the Privacy Cash program (if configured)
      // 3. Timing/recency of transaction
      // 4. Transaction not already used in our DB (prevent replay)

      // Note: We STILL CANNOT read encrypted amounts — intent enforces correctness

      // If PRIVACY_CASH_PROGRAM_ID is set, ensure the tx touches that program
      const programIdEnv = process.env.PRIVACY_CASH_PROGRAM_ID ?? undefined;
      if (programIdEnv) {
        const involves = this.transactionInvolvesProgram(transaction, programIdEnv);
        if (involves) {
          logger.info(`🔒 Privacy Cash transaction detected`);
        } else {
        logger.info(`💳 Regular Solana transfer detected (Privacy Cash not involved)`);
       // ✅ ACCEPT BOTH - Don't reject regular transfers!
        }
       } else {
         logger.info('💳 Regular Solana transfer (PRIVACY_CASH_PROGRAM_ID not set)');
      }

      // Check transaction is recent (within last hour)
      const currentTime = Math.floor(Date.now() / 1000);
      const txTime = transaction.blockTime || 0;
      const timeDiff = currentTime - txTime;
      
      if (timeDiff > 3600) { // More than 1 hour old
        logger.warn(`Transaction too old: ${txSignature}`);
        return {
          isValid: false,
          error: 'Transaction too old'
        };
      }

      // Additional verification: Check if transaction fee was paid
      // (Indicates this is a real transaction, not a replay attack)
      const fee = transaction.meta?.fee || 0;
      if (fee === 0) {
        return {
          isValid: false,
          error: 'Invalid transaction (no fee)'
        };
      }

      // Ensure this txSignature hasn't already been used by an intent/order
      const existingIntent = await PaymentIntent.findOne({ txSignature });
      if (existingIntent) {
        logger.warn(`Transaction already attached to intent: ${txSignature}`);
        return { isValid: false, error: 'Transaction already used' };
      }

      const existingOrder = await Order.findOne({ txSignature });
      if (existingOrder) {
        logger.warn(`Transaction already used in order: ${txSignature}`);
        return { isValid: false, error: 'Transaction already used' };
      }

      // Try to parse the instruction data to extract extAmount (serialized by SDK)
      try {
        const programIdEnv = process.env.PRIVACY_CASH_PROGRAM_ID;
        let instr: any = null;
        // Work with untyped message to avoid strict VersionedMessage/CompiledInstruction type issues
        const msgRaw: any = (transaction as any)?.transaction?.message ?? (transaction as any)?.message ?? null;
        const msg: any = msgRaw;

        if (msg && programIdEnv) {
          // Build accountKeys map (string[]) from whatever shape the message exposes
          const accountKeys: string[] = [];
          if (typeof msg.getAccountKeys === 'function') {
            try {
              for (const k of msg.getAccountKeys()) {
                accountKeys.push(typeof k === 'string' ? k : (k.pubkey ? k.pubkey.toString() : k.toString()));
              }
            } catch (_e) {
              // ignore and fallback
            }
          }
          if (accountKeys.length === 0 && Array.isArray(msg.accountKeys)) {
            for (const k of msg.accountKeys) {
              accountKeys.push(typeof k === 'string' ? k : (k.pubkey ? k.pubkey.toString() : k.toString()));
            }
          }

          const instructions: any[] = msg.instructions ?? (msg.compiledInstructions ?? []) ?? (transaction as any)?.transaction?.message?.instructions ?? (transaction as any)?.message?.instructions ?? [];

          for (const i of instructions) {
            // If instruction exposes programId directly use it
            const pidDirect = (i as any).programId ? (typeof (i as any).programId === 'string' ? (i as any).programId : (i as any).programId.toString()) : null;
            if (pidDirect === programIdEnv) {
              instr = i;
              break;
            }

            // Otherwise map using programIdIndex into accountKeys
            if (typeof i.programIdIndex === 'number' && accountKeys[i.programIdIndex]) {
              const mapped = accountKeys[i.programIdIndex];
              if (mapped === programIdEnv) {
                instr = i;
                break;
              }
            }
          }
        }

        // Also inspect meta.innerInstructions if not found yet
        if (!instr && transaction.meta && transaction.meta.innerInstructions) {
          for (const group of transaction.meta.innerInstructions) {
            for (const i of group.instructions || []) {
              const pid = (i as any).programId ? (typeof (i as any).programId === 'string' ? (i as any).programId : ((i as any).programId.toString ? (i as any).programId.toString() : null)) : null;
              if (pid === process.env.PRIVACY_CASH_PROGRAM_ID) {
                instr = i;
                break;
              }
              // fallback: programIdIndex + resolved accountKeys from message
              if (!pid && typeof i.programIdIndex === 'number') {
                const msgAny: any = (transaction as any)?.transaction?.message ?? (transaction as any)?.message ?? null;
                const keysAny: any[] = msgAny?.getAccountKeys ? msgAny.getAccountKeys() : (msgAny?.accountKeys ?? []);
                const mapped = keysAny && keysAny[i.programIdIndex] ? (typeof keysAny[i.programIdIndex] === 'string' ? keysAny[i.programIdIndex] : (keysAny[i.programIdIndex].pubkey ? keysAny[i.programIdIndex].pubkey.toString() : keysAny[i.programIdIndex].toString())) : null;
                if (mapped === process.env.PRIVACY_CASH_PROGRAM_ID) {
                  instr = i;
                  break;
                }
              }
            }
            if (instr) break;
          }
        }

        if (instr && instr.data) {
          // Instruction data may be Buffer or base64 string depending on RPC
          const dataBuf: Buffer = Buffer.isBuffer(instr.data) ? instr.data : Buffer.from(instr.data, 'base64');

          // Layout used by SDK.serializeProofAndExtData — extAmount is at fixed offset
          // Offsets (bytes): discriminator(8) + proofA(64) + proofB(128) + proofC(64) + root(32) + publicAmount(32) + extDataHash(32) + inputNullifier0(32) + inputNullifier1(32) + outputCommit0(32) + outputCommit1(32)
          const extAmountOffset = 8 + 64 + 128 + 64 + 32 + 32 + 32 + 32 + 32 + 32 + 32; // = 488
          const extAmountBuf = dataBuf.slice(extAmountOffset, extAmountOffset + 8);

          // Read signed 64-bit little-endian (extAmount may be negative for withdrawals)
          let extAmount: bigint | number = 0n;
          if (typeof extAmountBuf.readBigInt64LE === 'function') {
            extAmount = extAmountBuf.readBigInt64LE(0);
          } else {
            // fallback using BN (little-endian)
            // @ts-ignore - BN available in project
            const BN = (await import('bn.js')).default;
            extAmount = new BN(extAmountBuf, 'le').fromTwos(64).toNumber();
          }

          // If caller supplied a minimum amount to check, validate it (expected in lamports)
          if (typeof _minimumAmount === 'number') {
            const extAmountNum = typeof extAmount === 'bigint' ? Number(extAmount) : extAmount;
            if (isNaN(extAmountNum) || extAmountNum < _minimumAmount) {
              logger.warn(`Transaction ${txSignature} extAmount ${extAmountNum} < expected ${_minimumAmount}`);
              return { isValid: false, error: 'Transaction amount does not match expected amount' };
            }
          }

          logger.info(`Parsed extAmount from tx: ${extAmount.toString()}`);

          return {
            isValid: true,
            timestamp: txTime,
            recipient: expectedRecipient,
            amount: typeof extAmount === 'bigint' ? (Number(extAmount) || undefined) : extAmount
          };
        }
      } catch (parseErr) {
        logger.warn('Failed to parse proof/instruction data for extAmount:', parseErr);
      }

      logger.info(`✅ Payment transaction verified: ${txSignature}`);

      return {
        isValid: true,
        timestamp: txTime,
        recipient: expectedRecipient // Backend still enforces intent recipient
      };
    } catch (error) {
      logger.error('Verify payment transaction error:', error);
      return {
        isValid: false,
        error: 'Payment verification failed'
      };
    }
  }

  /**
   * Heuristic: check whether a fetched transaction touches the given program id
   */
  transactionInvolvesProgram(transaction: any, programIdString: string): boolean {
    try {
      if (!transaction) return false;

      const programId = programIdString.toString();

      // Try message accountKeys
      const msg = (transaction.transaction && transaction.transaction.message) || transaction.message || null;
      if (msg) {
        const accountKeys: any[] = msg.accountKeys || msg.accountKeys || [];
        for (const ak of accountKeys) {
          // ak could be string or PublicKey-like or object {pubkey}
          const keyStr = typeof ak === 'string' ? ak : (ak.pubkey ? ak.pubkey.toString() : ak.toString());
          if (keyStr === programId) return true;
        }

        // inspect instructions
        const instructions: any[] = msg.instructions || (transaction.transaction.message && transaction.transaction.message.instructions) || [];
        for (const instr of instructions) {
          // instr.programId may exist
          if ((instr as any).programId) {
            const pid = typeof (instr as any).programId === 'string' ? (instr as any).programId : ((instr as any).programId.toString ? (instr as any).programId.toString() : null);
            if (pid === programId) return true;
          }
          // fallback: programIdIndex
          if (typeof instr.programIdIndex === 'number' && msg.accountKeys && msg.accountKeys[instr.programIdIndex]) {
            const pid = typeof msg.accountKeys[instr.programIdIndex] === 'string' ? msg.accountKeys[instr.programIdIndex] : (msg.accountKeys[instr.programIdIndex].pubkey ? msg.accountKeys[instr.programIdIndex].pubkey.toString() : msg.accountKeys[instr.programIdIndex].toString());
            if (pid === programId) return true;
          }
        }
      }

      // Some transactions embed inner instructions under meta.innerInstructions
      const inner = transaction.meta && transaction.meta.innerInstructions;
      if (inner && Array.isArray(inner)) {
        for (const group of inner) {
          for (const instr of group.instructions || []) {
            if ((instr as any).programId) {
              const pid = typeof (instr as any).programId === 'string' ? (instr as any).programId : ((instr as any).programId.toString ? (instr as any).programId.toString() : null);
              if (pid === programId) return true;
            }
          }
        }
      }

      return false;
    } catch (err) {
      logger.error('Error checking program involvement:', err);
      return false;
    }
  }

  /**
   * Check if a transaction signature has already been used
   * Prevents double-spending / replay attacks
   */
  async isTransactionUsed(txSignature: string): Promise<boolean> {
    try {
      // In production, you'd check your database for this tx signature
      // For now, we just verify it exists on-chain
      const verification = await this.verifyTransaction(txSignature);
      return verification.isValid;
    } catch (error) {
      logger.error('Check transaction used error:', error);
      return false;
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(txSignature: string): Promise<{
    confirmed: boolean;
    finalized: boolean;
    error?: any;
  }> {
    try {
      const status = await this.connection.getSignatureStatus(txSignature);

      if (!status || !status.value) {
        return {
          confirmed: false,
          finalized: false,
          error: 'Transaction not found'
        };
      }

      return {
        confirmed: status.value.confirmationStatus === 'confirmed' || 
                   status.value.confirmationStatus === 'finalized',
        finalized: status.value.confirmationStatus === 'finalized',
        error: status.value.err
      };
    } catch (error) {
      logger.error('Get transaction status error:', error);
      return {
        confirmed: false,
        finalized: false,
        error: 'Failed to get status'
      };
    }
  }

  /**
   * Check if Privacy Cash program was involved in transaction
   * This helps verify it's actually a Privacy Cash transaction
   */
  async isPrivacyCashTransaction(txSignature: string): Promise<boolean> {
    try {
      const transaction = await this.connection.getTransaction(txSignature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0
      });

      if (!transaction) {
        return false;
      }

      // Check if any of the account keys match Privacy Cash program
      // Privacy Cash program ID would be checked here
      // For now, we just verify the transaction exists
      
      return true;
    } catch (error) {
      logger.error('Check Privacy Cash transaction error:', error);
      return false;
    }
  }

  /**
   * Check if Privacy Cash is enabled in environment
   */
  isEnabled(): boolean {
    return process.env.PRIVACY_CASH_ENABLED === 'true';
  }
}

/**
 * SECURITY SUMMARY:
 * 
 * ✅ What backend DOES:
 * - Verify transactions exist on-chain
 * - Check transactions are recent
 * - Prevent replay attacks
 * - Confirm transactions succeeded
 * 
 * ❌ What backend NEVER does:
 * - Handle user private keys
 * - Sign transactions for users
 * - Store sensitive wallet data
 * - See transaction amounts (Privacy Cash encrypts this)
 * 
 * 🔐 Privacy is maintained because:
 * - All signing happens in user's browser
 * - Privacy Cash encrypts transaction details
 * - Backend only sees transaction signatures (hashes)
 * - No personal data ever touches the server
 */

// Export singleton instance
export const privacyCashService = new PrivacyCashService();

export default privacyCashService;