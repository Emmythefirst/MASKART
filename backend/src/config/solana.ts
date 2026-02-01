import { Connection, clusterApiUrl, Commitment } from '@solana/web3.js';

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK as any);

/**
 * Get Solana connection instance
 */
export function getSolanaConnection(commitment: Commitment = 'confirmed'): Connection {
  return new Connection(SOLANA_RPC_URL, commitment);
}

/**
 * Get current network
 */
export function getNetwork(): string {
  return SOLANA_NETWORK;
}

/**
 * Check if running on devnet
 */
export function isDevnet(): boolean {
  return SOLANA_NETWORK === 'devnet';
}

/**
 * Check if running on mainnet
 */
export function isMainnet(): boolean {
  return SOLANA_NETWORK === 'mainnet-beta';
}

/**
 * Get RPC URL
 */
export function getRpcUrl(): string {
  return SOLANA_RPC_URL;
}

/**
 * Solana configuration object
 */
export const solanaConfig = {
  network: SOLANA_NETWORK,
  rpcUrl: SOLANA_RPC_URL,
  commitment: 'confirmed' as Commitment,
  connection: getSolanaConnection(),
};

export default solanaConfig;