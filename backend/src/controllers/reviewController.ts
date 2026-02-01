import { Request, Response } from 'express';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { hashWallet } from '../utils/crypto.js';
import { ApiResponse } from '../types/index.js';

// Create a review tied to an order. Enforce one review per order and verified purchase flag.
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, rating, commentHash, reviewerWallet } = req.body;
    if (!orderId || !rating) {
      res.status(400).json({ success: false, error: 'Missing required fields' } as ApiResponse);
      return;
    }

    const order = await Order.findOne({ orderId });
    if (!order) {
      res.status(404).json({ success: false, error: 'Order not found' } as ApiResponse);
      return;
    }

    // Prevent multiple reviews per order
    const existing = await Review.findOne({ orderId });
    if (existing) {
      res.status(409).json({ success: false, error: 'Review already exists for this order' } as ApiResponse);
      return;
    }

    const reviewerHash = reviewerWallet ? hashWallet(reviewerWallet) : 'anonymous';

    const review = await Review.create({
      reviewId: `rev_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
      orderId,
      productId: order.productId,
      sellerId: order.sellerId || '',
      reviewerHash,
      rating,
      commentHash,
      isVerifiedPurchase: !!order.txSignature
    });

    res.status(201).json({ success: true, data: review } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create review' } as ApiResponse);
  }
};

export const getReviewsByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get reviews' } as ApiResponse);
  }
};

export const getReviewsBySeller = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const reviews = await Review.find({ sellerId }).sort({ createdAt: -1 });
    res.json({ success: true, data: reviews } as ApiResponse);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get reviews' } as ApiResponse);
  }
};
