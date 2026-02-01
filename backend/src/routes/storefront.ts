import express from 'express';
import {
  createStorefront,
  getStorefront,
  getStorefrontByWallet,
  updateStorefront
} from '../controllers/storefrontController.js';

const router = express.Router();

// Create storefront
router.post('/', createStorefront);

// Get storefront by storeId
router.get('/:storeId', getStorefront);

// Get storefront by wallet address
router.get('/wallet/:walletAddress', getStorefrontByWallet);

// Update storefront
router.put('/:storeId', updateStorefront);

export default router;