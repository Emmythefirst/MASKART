// Product controller: handles CRUD operations for products.
// - `createProduct` handles multipart file uploads, encrypts the product, stores on IPFS,
//   and saves product metadata in the database.
// - `getStoreProducts` returns active products for a specific storefront.
// - `getAllProducts` exposes a public product listing used by the frontend.
import { Request, Response } from 'express';
import Product from '../models/Product.js';
import Storefront from '../models/Storefront.js';
import { generateProductId } from '../utils/idGenerator.js';
import { isValidPrice, isValidCategory, isValidCurrency } from '../utils/validators.js';
import { encryptProductFile, encryptKey, deleteTempFile } from '../services/encryptionService.js';
import { uploadToIPFS, uploadBufferToIPFS } from '../services/ipfsService.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new product
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      storeId, 
      title, 
      description, 
      price, 
      currency, 
      category,
      walletAddress 
    } = req.body;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const coverImage = files?.coverImage?.[0];
    const productFile = files?.productFile?.[0];

    // Validate required fields
    if (!storeId || !title || !description || !price || !category || !coverImage || !productFile) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields'
      } as ApiResponse);
      return;
    }

    // Validate storefront exists and user owns it
    const storefront = await Storefront.findOne({ storeId });
    if (!storefront) {
      res.status(404).json({
        success: false,
        error: 'Storefront not found'
      } as ApiResponse);
      return;
    }

    if (storefront.walletAddress !== walletAddress) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Not the store owner'
      } as ApiResponse);
      return;
    }

    // Validate price and category
    if (!isValidPrice(parseFloat(price))) {
      res.status(400).json({
        success: false,
        error: 'Invalid price'
      } as ApiResponse);
      return;
    }

    if (!isValidCategory(category)) {
      res.status(400).json({
        success: false,
        error: 'Invalid category'
      } as ApiResponse);
      return;
    }

    if (!isValidCurrency(currency || 'SOL')) {
      res.status(400).json({
        success: false,
        error: 'Invalid currency'
      } as ApiResponse);
      return;
    }

    logger.info(`Creating product: ${title} for store ${storeId}`);

    // Encrypt product file
    const { encryptedBuffer, encryptionKey } = await encryptProductFile(productFile.path);

    // Upload encrypted file to IPFS
    const ipfsHash = await uploadBufferToIPFS(encryptedBuffer, `encrypted_${productFile.originalname}`);

    // Upload cover image to IPFS
    const coverImageHash = await uploadToIPFS(coverImage.path, coverImage.originalname);

    // Encrypt the encryption key
    const encryptedKeyString = encryptKey(encryptionKey);

    // Create product
    const product = await Product.create({
      productId: generateProductId(),
      storeId,
      title,
      description,
      price: parseFloat(price),
      currency: currency || 'SOL',
      category,
      coverImage: coverImageHash,
      encryptedFileHash: ipfsHash,
      encryptedKey: encryptedKeyString,
      fileSize: productFile.size,
      fileName: productFile.originalname,
      fileType: productFile.mimetype
    });

    // Update storefront stats
    await Storefront.findOneAndUpdate(
      { storeId },
      { $inc: { 'stats.totalProducts': 1 } }
    );

    // Clean up temporary files
    await deleteTempFile(productFile.path);
    await deleteTempFile(coverImage.path);

    logger.info(`Product created: ${product.productId}`);

    res.status(201).json({
      success: true,
      data: {
        productId: product.productId,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        coverImage: product.coverImage,
        fileSize: product.fileSize,
        createdAt: product.createdAt
      },
      message: 'Product created successfully'
    } as ApiResponse);
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product'
    } as ApiResponse);
  }
};

/**
 * Get all products for a store
 */
export const getStoreProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;

    const products = await Product.find({ storeId, isActive: true })
      .select('-encryptedFileHash -encryptedKey')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    } as ApiResponse);
  } catch (error) {
    logger.error('Get store products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    } as ApiResponse);
  }
};

/**
 * Get single product details
 */
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const product = await Product.findOne({ productId, isActive: true })
      .select('-encryptedFileHash -encryptedKey');

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ApiResponse);
      return;
    }

    // Increment view count
    await Product.findOneAndUpdate(
      { productId },
      { $inc: { 'stats.views': 1 } }
    );

    res.json({
      success: true,
      data: product
    } as ApiResponse);
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get product'
    } as ApiResponse);
  }
};

/**
 * Update product
 */
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { title, description, price, walletAddress } = req.body;

    const product = await Product.findOne({ productId });
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ApiResponse);
      return;
    }

    // Verify ownership
    const storefront = await Storefront.findOne({ storeId: product.storeId });
    if (!storefront || storefront.walletAddress !== walletAddress) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized'
      } as ApiResponse);
      return;
    }

    // Update fields
    if (title) product.title = title;
    if (description) product.description = description;
    if (price && isValidPrice(parseFloat(price))) product.price = parseFloat(price);

    await product.save();

    logger.info(`Product updated: ${productId}`);

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    } as ApiResponse);
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product'
    } as ApiResponse);
  }
};

/**
 * Delete product (soft delete)
 */
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { walletAddress } = req.body;

    const product = await Product.findOne({ productId });
    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ApiResponse);
      return;
    }

    // Verify ownership
    const storefront = await Storefront.findOne({ storeId: product.storeId });
    if (!storefront || storefront.walletAddress !== walletAddress) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized'
      } as ApiResponse);
      return;
    }

    product.isActive = false;
    await product.save();

    // Update storefront stats
    await Storefront.findOneAndUpdate(
      { storeId: product.storeId },
      { $inc: { 'stats.totalProducts': -1 } }
    );

    logger.info(`Product deleted: ${productId}`);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    } as ApiResponse);
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product'
    } as ApiResponse);
  }
};

/**
 * Get all active products (public)
 */
export const getAllProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true })
      .select('-encryptedFileHash -encryptedKey')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products
    } as ApiResponse);
  } catch (error) {
    logger.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get products'
    } as ApiResponse);
  }
};