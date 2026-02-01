// Routes for product management and public product listing.
// These endpoints expose CRUD operations for products and also provide
// a public `GET /` endpoint that the frontend uses to render the product catalog.
import express from 'express';
import upload from '../middleware/upload.js';
import { requireWallet } from '../middleware/auth.js';
import {
  createProduct,
  getStoreProducts,
  getAllProducts,
  getProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// Create product (with file uploads)
router.post(
  '/',
  upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'productFile', maxCount: 1 }
  ]),
  requireWallet,
  createProduct
);

// Get all products for a store
// Public listing
router.get('/', getAllProducts);

// Get all products for a specific store
router.get('/store/:storeId', getStoreProducts);

// Get single product
router.get('/:productId', getProduct);

// Update product
router.put('/:productId', requireWallet, updateProduct);

// Delete product
router.delete('/:productId', requireWallet, deleteProduct);

export default router;