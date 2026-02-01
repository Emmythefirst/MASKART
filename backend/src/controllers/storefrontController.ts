import { Request, Response } from 'express';
import Storefront from '../models/Storefront.js';
import { generateStoreId } from '../utils/idGenerator.js';
import { encrypt } from '../utils/crypto.js';
import { isValidSolanaAddress } from '../utils/validators.js';
import { ApiResponse } from '../types/index.js';

/**
 * Create a new storefront
 */
export const createStorefront = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeName, description, walletAddress, contactInfo, primaryColor } = req.body;

    // Validate required fields
    if (!storeName || !walletAddress) {
      res.status(400).json({
        success: false,
        error: 'Store name and wallet address are required'
      } as ApiResponse);
      return;
    }

    // Validate wallet address
    if (!isValidSolanaAddress(walletAddress)) {
      res.status(400).json({
        success: false,
        error: 'Invalid Solana wallet address'
      } as ApiResponse);
      return;
    }

    // Check if store already exists for this wallet
    const existingStore = await Storefront.findOne({ walletAddress, isActive: true });
    if (existingStore) {
      res.status(409).json({
        success: false,
        error: 'Store already exists for this wallet'
      } as ApiResponse);
      return;
    }

    // Encrypt contact info if provided
    const encryptedContactInfo = contactInfo ? encrypt(contactInfo) : undefined;

    // Create storefront
    const storefront = await Storefront.create({
      storeId: generateStoreId(),
      storeName,
      description,
      walletAddress,
      encryptedContactInfo,
      theme: {
        primaryColor: primaryColor || '#8B5CF6'
      }
    });

    // Ensure a SellerIdentity exists for this wallet (persistent anonymous identity)
    try {
      const { createOrGetSeller } = await import('./sellerIdentityController.js');
      await createOrGetSeller(walletAddress);
    } catch (e) {
      // non-fatal: log and continue. Seller identity is helpful for reputation.
      console.warn('Failed to create/get seller identity:', e);
    }

    res.status(201).json({
      success: true,
      data: {
        storeId: storefront.storeId,
        storeName: storefront.storeName,
        description: storefront.description,
        walletAddress: storefront.walletAddress,
        theme: storefront.theme,
        stats: storefront.stats,
        createdAt: storefront.createdAt
      },
      message: 'Storefront created successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Create storefront error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create storefront'
    } as ApiResponse);
  }
};

/**
 * Get storefront by ID
 */
export const getStorefront = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;

    const storefront = await Storefront.findOne({ storeId, isActive: true });

    if (!storefront) {
      res.status(404).json({
        success: false,
        error: 'Storefront not found'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        storeId: storefront.storeId,
        storeName: storefront.storeName,
        description: storefront.description,
        theme: storefront.theme,
        stats: storefront.stats,
        createdAt: storefront.createdAt
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get storefront error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storefront'
    } as ApiResponse);
  }
};

/**
 * Get storefront by wallet address
 */
export const getStorefrontByWallet = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;

    if (!isValidSolanaAddress(walletAddress)) {
      res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      } as ApiResponse);
      return;
    }

    const storefront = await Storefront.findOne({ walletAddress, isActive: true });

    if (!storefront) {
      res.status(404).json({
        success: false,
        error: 'No storefront found for this wallet'
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: {
        storeId: storefront.storeId,
        storeName: storefront.storeName,
        description: storefront.description,
        walletAddress: storefront.walletAddress,
        theme: storefront.theme,
        stats: storefront.stats,
        createdAt: storefront.createdAt
      }
    } as ApiResponse);
  } catch (error) {
    console.error('Get storefront by wallet error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get storefront'
    } as ApiResponse);
  }
};

/**
 * Update storefront
 */
export const updateStorefront = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;
    const { storeName, description, primaryColor, walletAddress } = req.body;

    const storefront = await Storefront.findOne({ storeId });

    if (!storefront) {
      res.status(404).json({
        success: false,
        error: 'Storefront not found'
      } as ApiResponse);
      return;
    }

    // Verify ownership
    if (storefront.walletAddress !== walletAddress) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Not the store owner'
      } as ApiResponse);
      return;
    }

    // Update fields
    if (storeName) storefront.storeName = storeName;
    if (description !== undefined) storefront.description = description;
    if (primaryColor) storefront.theme.primaryColor = primaryColor;

    await storefront.save();

    res.json({
      success: true,
      data: {
        storeId: storefront.storeId,
        storeName: storefront.storeName,
        description: storefront.description,
        theme: storefront.theme,
        stats: storefront.stats,
        updatedAt: storefront.updatedAt
      },
      message: 'Storefront updated successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Update storefront error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update storefront'
    } as ApiResponse);
  }
};