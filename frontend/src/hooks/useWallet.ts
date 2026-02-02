import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';

export function useWallet() {
  const wallet = useSolanaWallet();

  const walletAddress = useMemo(() => {
    return wallet.publicKey?.toBase58() || null;
  }, [wallet.publicKey]);

  const isConnected = useMemo(() => {
    return wallet.connected && !!wallet.publicKey;
  }, [wallet.connected, wallet.publicKey]);

  return {
    ...wallet,
    walletAddress,
    isConnected,
  };
}