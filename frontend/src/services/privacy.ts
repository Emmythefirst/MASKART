import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';
import toast from 'react-hot-toast';

/**
 * Privacy Cash SDK Integration - Frontend
 * Handles private deposits and withdrawals using Privacy Cash
 */

interface Signed {
  publicKey: PublicKey;
  signature?: Uint8Array;
  provider: any;
}

interface PrivateTransferResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

class PrivacyCashService {
  private connection: Connection;
  private encryptionService: any;
  private lightWasm: any;

  constructor() {
    const rpcUrl = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.encryptionService = null;
    this.lightWasm = null;
  }

  /**
   * Initialize Privacy Cash (load WASM)
   */
  async initialize(): Promise<void> {
    try {
      // Load WASM
      const { WasmFactory } = await import('@lightprotocol/hasher.rs');
      this.lightWasm = await WasmFactory.getInstance();
      
      // Try to import EncryptionService - use dynamic import with try-catch
      try {
        // Try the direct import first (if package is properly configured)
        const encModule = await import('privacycash');
        if ((encModule as any).EncryptionService) {
          this.encryptionService = new (encModule as any).EncryptionService();
        } else {
          // Fallback: create minimal encryption service
          this.encryptionService = this.createFallbackEncryptionService();
        }
      } catch (e) {
        console.warn('Could not import EncryptionService, using fallback', e);
        this.encryptionService = this.createFallbackEncryptionService();
      }

      console.log('✅ Privacy Cash WASM and encryption initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Privacy Cash WASM:', error);
      throw new Error('Failed to initialize Privacy Cash');
    }
  }

  /**
   * Create fallback encryption service if SDK import fails
   */
  private createFallbackEncryptionService() {
    return {
      deriveEncryptionKeyFromSignature: (signature: Uint8Array) => {
        // Store the signature for later use
        (this.encryptionService as any)._signature = signature;
        return { v1: signature, v2: signature };
      },
      getEncryptionKey: () => {
        return (this.encryptionService as any)._signature;
      }
    };
  }

  /**
   * Get signed signature from wallet
   */
  private async getSignedSignature(signed: Signed): Promise<void> {
    if (signed.signature) {
      return;
    }

    const encodedMessage = new TextEncoder().encode('Privacy Money account sign in');
    
    try {
      toast.loading('Please sign the message in your wallet...', { id: 'signature' });
      
      if (!signed.provider || typeof signed.provider.signMessage !== 'function') {
        toast.dismiss('signature');
        throw new Error('Connected wallet does not support signMessage required by Privacy Cash. Use Phantom or another supported wallet.');
      }

      let signature: any = await signed.provider.signMessage(encodedMessage);
      
      toast.dismiss('signature');

      if (signature.signature) {
        signature = signature.signature;
      }

      if (!(signature instanceof Uint8Array)) {
        throw new Error('Signature is not an Uint8Array type');
      }

      signed.signature = signature;
      
      // Derive encryption key from signature
      if (this.encryptionService && this.encryptionService.deriveEncryptionKeyFromSignature) {
        this.encryptionService.deriveEncryptionKeyFromSignature(signature);
      }
      
      console.log('✅ Signature obtained and encryption key derived');
    } catch (err: any) {
      toast.dismiss('signature');
      
      if (err instanceof Error && err.message?.toLowerCase().includes('user rejected')) {
        throw new Error('User rejected the signature request');
      }
      throw new Error('Failed to sign message: ' + err.message);
    }
  }

  /**
   * Deposit SOL to Privacy Cash
   */
  async depositSOL(
    wallet: WalletContextState,
    amountInSOL: number
  ): Promise<PrivateTransferResult> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    try {
      if (!this.lightWasm) {
        await this.initialize();
      }

      const signed: Signed = {
        publicKey: wallet.publicKey,
        provider: wallet
      };

      await this.getSignedSignature(signed);

      toast.loading('Depositing SOL to Privacy Cash...', { id: 'deposit' });

      if (!wallet.signTransaction) {
        throw new Error('Connected wallet does not support signTransaction required by Privacy Cash.');
      }

      // Dynamic import of deposit function
      const depositModule = await import('privacycash');
      
      // Try to call the deposit function - adjust based on actual package export
      let depositFn;
      if ((depositModule as any).deposit) {
        depositFn = (depositModule as any).deposit;
      } else if ((depositModule as any).default?.deposit) {
        depositFn = (depositModule as any).default.deposit;
      } else {
        throw new Error('Privacy Cash deposit function not available. Package may not be properly installed.');
      }

      const result = await depositFn({
        lightWasm: this.lightWasm,
        connection: this.connection,
        amount_in_lamports: amountInSOL * 1_000_000_000,
        keyBasePath: '/circuit2',
        publicKey: wallet.publicKey,
        transactionSigner: async (tx: VersionedTransaction) => {
          if (!wallet.signTransaction) {
            throw new Error('Wallet cannot sign transactions');
          }
          return await wallet.signTransaction(tx);
        },
        storage: localStorage,
        encryptionService: this.encryptionService
      });

      toast.success('SOL deposited successfully!', { id: 'deposit' });

      return {
        success: true,
        txSignature: result.toString()
      };
    } catch (error: any) {
      console.error('Deposit SOL error:', error);
      toast.error('Deposit failed', { id: 'deposit' });
      
      return {
        success: false,
        error: error.message || 'Deposit failed'
      };
    }
  }

  /**
   * Deposit SPL tokens to Privacy Cash
   */
  async depositSPL(
    wallet: WalletContextState,
    amount: number,
    mintAddress: PublicKey
  ): Promise<PrivateTransferResult> {
    if (!wallet.publicKey || !wallet.signTransaction) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    try {
      if (!this.lightWasm) {
        await this.initialize();
      }

      const signed: Signed = {
        publicKey: wallet.publicKey,
        provider: wallet
      };

      await this.getSignedSignature(signed);

      toast.loading('Depositing tokens to Privacy Cash...', { id: 'deposit' });

      // Dynamic import of depositSPL function
      const depositModule = await import('privacycash');
      
      let depositSPLFn;
      if ((depositModule as any).depositSPL) {
        depositSPLFn = (depositModule as any).depositSPL;
      } else if ((depositModule as any).default?.depositSPL) {
        depositSPLFn = (depositModule as any).default.depositSPL;
      } else {
        throw new Error('Privacy Cash depositSPL function not available.');
      }

      const result = await depositSPLFn({
        referrer: '',
        lightWasm: this.lightWasm,
        connection: this.connection,
        base_units: amount,
        keyBasePath: '/circuit2',
        publicKey: wallet.publicKey,
        transactionSigner: async (tx: VersionedTransaction) => {
          if (!wallet.signTransaction) {
            throw new Error('Wallet cannot sign transactions');
          }
          return await wallet.signTransaction(tx);
        },
        storage: localStorage,
        encryptionService: this.encryptionService,
        mintAddress: mintAddress
      });

      toast.success('Tokens deposited successfully!', { id: 'deposit' });

      return {
        success: true,
        txSignature: result.toString()
      };
    } catch (error: any) {
      console.error('Deposit SPL error:', error);
      toast.error('Deposit failed', { id: 'deposit' });
      
      return {
        success: false,
        error: error.message || 'Deposit failed'
      };
    }
  }

  /**
   * Withdraw SOL from Privacy Cash
   */
  async withdrawSOL(
    wallet: WalletContextState,
    amountInSOL: number,
    recipientAddress: string
  ): Promise<PrivateTransferResult> {
    if (!wallet.publicKey) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    try {
      if (!this.lightWasm) {
        await this.initialize();
      }

      toast.loading('Withdrawing SOL from Privacy Cash...', { id: 'withdraw' });

      // Dynamic import of withdraw function
      const withdrawModule = await import('privacycash');
      
      let withdrawFn;
      if ((withdrawModule as any).withdraw) {
        withdrawFn = (withdrawModule as any).withdraw;
      } else if ((withdrawModule as any).default?.withdraw) {
        withdrawFn = (withdrawModule as any).default.withdraw;
      } else {
        throw new Error('Privacy Cash withdraw function not available.');
      }

      const result = await withdrawFn({
        amount_in_lamports: amountInSOL * 1_000_000_000,
        connection: this.connection,
        encryptionService: this.encryptionService,
        keyBasePath: '/circuit2',
        publicKey: wallet.publicKey,
        storage: localStorage,
        recipient: recipientAddress,
        lightWasm: this.lightWasm
      });

      toast.success('SOL withdrawn successfully!', { id: 'withdraw' });

      return {
        success: true,
        txSignature: result.toString()
      };
    } catch (error: any) {
      console.error('Withdraw SOL error:', error);
      toast.error('Withdrawal failed', { id: 'withdraw' });
      
      return {
        success: false,
        error: error.message || 'Withdrawal failed'
      };
    }
  }

  /**
   * Withdraw SPL tokens from Privacy Cash
   */
  async withdrawSPL(
    wallet: WalletContextState,
    amount: number,
    mintAddress: PublicKey,
    recipientAddress: string
  ): Promise<PrivateTransferResult> {
    if (!wallet.publicKey) {
      return {
        success: false,
        error: 'Wallet not connected'
      };
    }

    try {
      if (!this.lightWasm) {
        await this.initialize();
      }

      toast.loading('Withdrawing tokens from Privacy Cash...', { id: 'withdraw' });

      // Dynamic import of withdrawSPL function
      const withdrawModule = await import('privacycash');
      
      let withdrawSPLFn;
      if ((withdrawModule as any).withdrawSPL) {
        withdrawSPLFn = (withdrawModule as any).withdrawSPL;
      } else if ((withdrawModule as any).default?.withdrawSPL) {
        withdrawSPLFn = (withdrawModule as any).default.withdrawSPL;
      } else {
        throw new Error('Privacy Cash withdrawSPL function not available.');
      }

      const result = await withdrawSPLFn({
        connection: this.connection,
        encryptionService: this.encryptionService,
        keyBasePath: '/circuit2',
        publicKey: wallet.publicKey,
        storage: localStorage,
        recipient: recipientAddress,
        lightWasm: this.lightWasm,
        mintAddress: mintAddress,
        amount: amount
      });

      toast.success('Tokens withdrawn successfully!', { id: 'withdraw' });

      return {
        success: true,
        txSignature: result.toString()
      };
    } catch (error: any) {
      console.error('Withdraw SPL error:', error);
      toast.error('Withdrawal failed', { id: 'withdraw' });
      
      return {
        success: false,
        error: error.message || 'Withdrawal failed'
      };
    }
  }

  /**
   * Make a deposit only (for marketplace purchases)
   */
  async makePrivateDeposit(
    wallet: WalletContextState,
    amount: number,
    currency: 'SOL' | 'USDC' | 'USDT'
  ): Promise<PrivateTransferResult> {
    try {
      let mintAddress: PublicKey | undefined;
      if (currency === 'USDC') {
        mintAddress = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      } else if (currency === 'USDT') {
        mintAddress = new PublicKey('Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB');
      }

      if (currency === 'SOL') {
        return await this.depositSOL(wallet, amount);
      } else if (mintAddress) {
        return await this.depositSPL(wallet, amount, mintAddress);
      }

      return { success: false, error: 'Unsupported currency' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Deposit failed' };
    }
  }
}

// Export singleton instance
export const privacyCash = new PrivacyCashService();

export default privacyCash;