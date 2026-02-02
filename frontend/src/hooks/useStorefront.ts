import { useState, useEffect } from 'react';
import { storefrontAPI } from '../services/api';
import type { Storefront } from '../types';

export function useStorefront(storeId?: string, walletAddress?: string) {
  const [storefront, setStorefront] = useState<Storefront | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storeId) {
      loadByStoreId(storeId);
    } else if (walletAddress) {
      loadByWallet(walletAddress);
    } else {
      setLoading(false);
    }
  }, [storeId, walletAddress]);

  const loadByStoreId = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await storefrontAPI.getById(id);
      
      if (response.success && response.data) {
        setStorefront(response.data);
      } else {
        setError(response.error || 'Store not found');
        setStorefront(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load store');
      setStorefront(null);
    } finally {
      setLoading(false);
    }
  };

  const loadByWallet = async (wallet: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await storefrontAPI.getByWallet(wallet);
      
      if (response.success && response.data) {
        setStorefront(response.data);
      } else {
        setStorefront(null);
      }
    } catch (err: any) {
      setStorefront(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    if (storeId) {
      loadByStoreId(storeId);
    } else if (walletAddress) {
      loadByWallet(walletAddress);
    }
  };

  return { storefront, loading, error, refresh };
}