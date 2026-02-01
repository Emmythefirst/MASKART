import { Request, Response } from 'express';
import SellerIdentity, { SellerIdentityDocument } from '../models/SellerIdentity.js';
import crypto from 'crypto';
import { ApiResponse } from '../types/index.js';

// Helper: derive a short sellerId from a wallet address (sha256 hex, uppercase short)
function deriveSellerId(walletAddress: string): string {
  return crypto.createHash('sha256').update(walletAddress).digest('hex').slice(0, 8).toUpperCase();
}

export const createOrGetSeller = async (walletAddress: string):  Promise<SellerIdentityDocument> => {
  const existing = await SellerIdentity.findOne({ walletAddress });
  if (existing) return existing;
  const sellerId = deriveSellerId(walletAddress);
  const doc = await SellerIdentity.create({ sellerId, walletAddress });
  return doc;
};

export const getSellerByWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;
    const seller = await SellerIdentity.findOne({ walletAddress });
    if (!seller) {
      res.status(404).json({ success: false, error: 'Seller not found' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: seller } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get seller' } as ApiResponse);
  }
};

export const getSellerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const seller = await SellerIdentity.findOne({ sellerId });
    if (!seller) {
      res.status(404).json({ success: false, error: 'Seller not found' } as ApiResponse);
      return;
    }
    res.json({ success: true, data: seller } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get seller' } as ApiResponse);
  }
};
