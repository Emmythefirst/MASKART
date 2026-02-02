import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import type { WalletContextState } from '@solana/wallet-adapter-react';

const SOLANA_NETWORK = import.meta.env.VITE_SOLANA_NETWORK || 'devnet';
const RPC_URL = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

/**
 * Get Solana connection
 */
export function getConnection(): Connection {
  return new Connection(RPC_URL, 'confirmed');
}

/**
 * Get wallet balance in SOL
 */
export async function getBalance(publicKey: PublicKey): Promise<number> {
  try {
    const connection = getConnection();
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Get balance error:', error);
    return 0;
  }
}

/**
 * Send SOL transaction
 */
export async function sendTransaction(
  wallet: WalletContextState,
  recipientAddress: string,
  amount: number
): Promise<string> {
  if (!wallet.publicKey || !wallet.signTransaction) {
    throw new Error('Wallet not connected');
  }

  try {
    const connection = getConnection();
    const recipient = new PublicKey(recipientAddress);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: recipient,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    const signed = await wallet.signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    
    await connection.confirmTransaction(signature, 'confirmed');

    return signature;
  } catch (error) {
    console.error('Send transaction error:', error);
    throw error;
  }
}

/**
 * Sign message with wallet
 */
export async function signMessage(
  wallet: WalletContextState,
  message: string
): Promise<Uint8Array> {
  if (!wallet.signMessage) {
    throw new Error('Wallet does not support message signing');
  }

  const encodedMessage = new TextEncoder().encode(message);
  const signature = await wallet.signMessage(encodedMessage);
  
  return signature;
}

/**
 * Verify wallet signature
 */
export async function verifySignature(
  publicKey: PublicKey,
  message: string,
  signature: Uint8Array
): Promise<boolean> {
  try {
    const nacl = await import('tweetnacl');
    const encodedMessage = new TextEncoder().encode(message);
    
    return nacl.sign.detached.verify(
      encodedMessage,
      signature,
      publicKey.toBytes()
    );
  } catch (error) {
    console.error('Verify signature error:', error);
    return false;
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(signature: string) {
  try {
    const connection = getConnection();
    const tx = await connection.getTransaction(signature, {
      commitment: 'confirmed',
    });
    return tx;
  } catch (error) {
    console.error('Get transaction error:', error);
    return null;
  }
}

/**
 * Airdrop SOL (devnet only)
 */
export async function airdrop(publicKey: PublicKey, amount: number = 1): Promise<string> {
  if (SOLANA_NETWORK !== 'devnet') {
    throw new Error('Airdrop only available on devnet');
  }

  try {
    const connection = getConnection();
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    
    await connection.confirmTransaction(signature, 'confirmed');
    
    return signature;
  } catch (error) {
    console.error('Airdrop error:', error);
    throw error;
  }
}