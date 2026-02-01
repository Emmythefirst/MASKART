import express from 'express';
import { createReview, getReviewsByProduct, getReviewsBySeller } from '../controllers/reviewController.js';

const router = express.Router();

// Create review (buyer must include their wallet for verification)
router.post('/', createReview);

// Get reviews for a product
router.get('/product/:productId', getReviewsByProduct);

// Get reviews for a seller
router.get('/seller/:sellerId', getReviewsBySeller);

export default router;
