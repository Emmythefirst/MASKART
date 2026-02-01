import express from 'express';
import { getSellerByWallet, getSellerById } from '../controllers/sellerIdentityController.js';

const router = express.Router();

// GET /api/seller/wallet/:walletAddress
router.get('/wallet/:walletAddress', getSellerByWallet);

// GET /api/seller/:sellerId
router.get('/:sellerId', getSellerById);

export default router;
