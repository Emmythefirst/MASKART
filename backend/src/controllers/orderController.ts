import { Request, Response } from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Storefront from '../models/Storefront.js';
import SellerIdentity from '../models/SellerIdentity.js';
import { generateOrderId, generateDownloadToken } from '../utils/idGenerator.js';
import { hashWallet } from '../utils/crypto.js';
import { ApiResponse } from '../types/index.js';
import { logger } from '../utils/logger.js';

/**
 * Create a new order (after payment)
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId, buyerWallet, txSignature } = req.body;

    console.log('📦 Create order request:', { productId, buyerWallet: buyerWallet?.slice(0, 8), txSignature: txSignature?.slice(0, 20) });

    if (!productId || !buyerWallet || !txSignature) {
      console.error('❌ Missing required fields:', { 
        hasProductId: !!productId, 
        hasBuyerWallet: !!buyerWallet, 
        hasTxSignature: !!txSignature 
      });
      res.status(400).json({
        success: false,
        error: 'Missing required fields: productId, buyerWallet, txSignature'
      } as ApiResponse);
      return;
    }

    // Get product
    const product = await Product.findOne({ productId, isActive: true });
    if (!product) {
      console.error('❌ Product not found:', productId);
      res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ApiResponse);
      return;
    }

    console.log('✅ Product found:', product.title);

    // Check if order already exists for this transaction
    const existingOrder = await Order.findOne({ txSignature });
    if (existingOrder) {
      console.warn('⚠️ Order already exists for transaction:', txSignature);
      res.status(409).json({
        success: false,
        error: 'Order already exists for this transaction'
      } as ApiResponse);
      return;
    }

    // Hash buyer wallet for privacy
    const buyerWalletHash = hashWallet(buyerWallet);

    // Calculate expiry (24 hours from now)
    const expiryHours = parseInt(process.env.ORDER_EXPIRY_HOURS || '24');
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    // ✅ Check if we're in mock/development mode
    const IS_MOCK = process.env.SOLANA_NETWORK === 'devnet' || process.env.NODE_ENV === 'development';

    console.log(`🎭 Mock mode: ${IS_MOCK}`);

    // Create order
    const order = await Order.create({
      orderId: generateOrderId(),
      productId,
      storeId: product.storeId,
      buyerWalletHash,
      txSignature,
      amount: product.price,
      currency: product.currency,
      // ✅ In mock mode: auto-deliver for demo
      // In production: start as confirmed
      status: IS_MOCK ? 'delivered' : 'confirmed',
      downloadedAt: IS_MOCK ? new Date() : undefined,
      // escrow fields
      escrowState: IS_MOCK ? 'ESCROW_RELEASED' : 'ESCROW_LOCKED',
      downloadToken: generateDownloadToken(),
      expiresAt
    });

    console.log(`✅ Order created: ${order.orderId} - Status: ${order.status}`);

    // Try to attach sellerId (persistent anonymous identity) for reputational tracking
    try {
      const storefront = await Storefront.findOne({ storeId: product.storeId });
      if (storefront) {
        const seller = await SellerIdentity.findOne({ walletAddress: storefront.walletAddress });
        if (seller) {
          order.sellerId = seller.sellerId;
          await order.save();
        }
      }
    } catch (_e) {
      // non-fatal
    }

    // Update product stats
    await Product.findOneAndUpdate(
      { productId },
      { 
        $inc: { 
          'stats.sales': 1,
          'stats.revenue': product.price
        } 
      }
    );

    // Update storefront stats
    await Storefront.findOneAndUpdate(
      { storeId: product.storeId },
      { 
        $inc: { 
          'stats.totalSales': 1,
          'stats.totalRevenue': product.price
        } 
      }
    );

    logger.info(`✅ Order stats updated for product ${productId} and store ${product.storeId}`);

    // ✅ Only try escrow in production mode
    if (!IS_MOCK) {
      try {
        const { lockEscrow } = await import('../services/escrowService.js');
        await lockEscrow(order.orderId, txSignature, product.price, product.storeId);
      } catch (e) {
        logger.warn('Lock escrow attempt failed (relayer may be unconfigured)', e);
      }
    } else {
      logger.info('🎭 Mock mode: Skipping escrow lock, order auto-delivered');
    }

    res.status(201).json({
      success: true,
      data: {
        orderId: order.orderId,
        productId: order.productId,
        downloadToken: order.downloadToken,
        expiresAt: order.expiresAt,
        status: order.status
      },
      message: 'Order created successfully'
    } as ApiResponse);
  } catch (error: any) {
    logger.error('❌ Create order error:', error);
    console.error('❌ Full error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    } as ApiResponse);
  }
};

/**
 * Get order by download token
 */
export const getOrderByToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { downloadToken } = req.params;

    const order = await Order.findOne({ downloadToken });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found or expired'
      } as ApiResponse);
      return;
    }

    // Check if expired
    if (new Date() > order.expiresAt) {
      res.status(410).json({
        success: false,
        error: 'Download link expired'
      } as ApiResponse);
      return;
    }

    // Get product details
    const product = await Product.findOne({ productId: order.productId });

    res.json({
      success: true,
      data: {
        orderId: order.orderId,
        product: {
          title: product?.title,
          fileName: product?.fileName,
          fileSize: product?.fileSize
        },
        expiresAt: order.expiresAt,
        downloadedAt: order.downloadedAt,
        status: order.status
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Get order by token error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    } as ApiResponse);
  }
};

/**
 * Download product file
 */
export const downloadProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { downloadToken } = req.params;

    const order = await Order.findOne({ downloadToken });

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found'
      } as ApiResponse);
      return;
    }

    // Check if expired
    if (new Date() > order.expiresAt) {
      res.status(410).json({
        success: false,
        error: 'Download link expired'
      } as ApiResponse);
      return;
    }

    // Get product with encrypted file info
    const product = await Product.findOne({ productId: order.productId });

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found'
      } as ApiResponse);
      return;
    }

    // Mark as downloaded (only if not already downloaded)
    if (!order.downloadedAt) {
      order.downloadedAt = new Date();
      order.status = 'delivered';
      order.escrowState = 'ESCROW_RELEASED'; // Adding this for demo purpose for the order processing status after purchase
      await order.save();
    }

    logger.info(`Product downloaded: ${product.productId} via order ${order.orderId}`);

    // In production, you'd:
    // 1. Download encrypted file from IPFS
    // 2. Decrypt the encryption key
    // 3. Decrypt the file
    // 4. Stream to user

    // For MVP, we'll return file info
    res.json({
      success: true,
      data: {
        fileName: product.fileName,
        fileSize: product.fileSize,
        fileType: product.fileType,
        // In production: provide actual decrypted file stream or download URL
        downloadUrl: `${process.env.IPFS_GATEWAY}${product.encryptedFileHash}`,
        message: 'File ready for download'
      }
    } as ApiResponse);
  } catch (error) {
    logger.error('Download product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download product'
    } as ApiResponse);
  }
};

/**
 * Get buyer's orders (by wallet hash)
 */
export const getBuyerOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { walletAddress } = req.params;

    const buyerWalletHash = hashWallet(walletAddress);

    const orders = await Order.find({ buyerWalletHash })
      .sort({ createdAt: -1 })
      .limit(50);

    // Get product details for each order
    const ordersWithProducts = await Promise.all(
      orders.map(async (order) => {
        const product = await Product.findOne({ productId: order.productId })
          .select('title coverImage price currency');
        
        return {
          orderId: order.orderId,
          sellerId: order.sellerId,
          product,
          amount: order.amount,
          currency: order.currency,
          status: order.status,
          createdAt: order.createdAt,
          expiresAt: order.expiresAt,
          downloadToken: order.downloadToken
        };
      })
    );

    res.json({
      success: true,
      data: ordersWithProducts
    } as ApiResponse);
  } catch (error) {
    logger.error('Get buyer orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orders'
    } as ApiResponse);
  }
};

/**
 * Get order by ID (private)
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    
    console.log('📦 Fetching order:', orderId);
    
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      console.error('❌ Order not found:', orderId);
      res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      } as ApiResponse);
      return;
    }

    console.log('✅ Order found:', order.orderId, 'Status:', order.status);

    // ✅ Populate product details for order view
    const product = await Product.findOne({ productId: order.productId });

    res.json({ 
      success: true, 
      data: {
        ...order.toObject(),
        product: product ? {
          title: product.title,
          coverImage: product.coverImage,
          price: product.price,
          currency: product.currency,
          fileName: product.fileName,
          fileType: product.fileType
        } : null
      }
    } as ApiResponse);
    
  } catch (error) {
    logger.error('❌ Get order by id error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get order' 
    } as ApiResponse);
  }
};