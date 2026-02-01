import express from 'express';
import { requireWallet, optionalWallet } from '../middleware/auth.js';
import {
  createOrder,
  getOrderByToken,
  downloadProduct,
  getBuyerOrders,
  getOrderById
} from '../controllers/orderController.js';
import Order from '../models/Order.js';
import { hashWallet } from '../utils/crypto.js';
import { openDispute, releaseEscrow } from '../services/escrowService.js';
import { markFileAvailable } from '../services/escrowService.js';

const router = express.Router();

// Create order (after payment confirmation)
router.post('/', requireWallet, createOrder);

// Buyer confirms delivery -> release escrow (simplified)
router.post('/:orderId/confirm', requireWallet, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const buyerHash = hashWallet(req.body.buyerWallet || req.body.walletAddress || '');
    if (buyerHash !== order.buyerWalletHash) return res.status(403).json({ success: false, error: 'Unauthorized' });
    const updated = await releaseEscrow(orderId);
    return res.json({ success: true, data: { orderId: updated.orderId, status: updated.status } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to confirm delivery' });
  }
});

// Buyer opens dispute
router.post('/:orderId/dispute', requireWallet, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    const buyerHash = hashWallet(req.body.buyerWallet || req.body.walletAddress || '');
    if (buyerHash !== order.buyerWalletHash) return res.status(403).json({ success: false, error: 'Unauthorized' });
    const updated = await openDispute(orderId, reason);
    // In production: notify admins, lock funds, record evidence
    return res.json({ success: true, data: { 
      orderId: updated.orderId, 
      disputeStatus: updated.disputeStatus,
      disputeReason: updated.disputeReason,
      disputeOpenedAt: updated.disputeOpenedAt
     } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to open dispute' });
  }
});

// Get order by download token (public)
router.get('/download/:downloadToken', getOrderByToken);

// Download product file
router.post('/download/:downloadToken', downloadProduct);

// Get buyer's order history
router.get('/buyer/:walletAddress', optionalWallet, getBuyerOrders);

// Seller uploads encrypted key CID (IPFS) for proof-of-delivery
router.post('/:orderId/upload-key', requireWallet, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { encryptedKeyCid } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    // Basic check: in production verify caller is the seller
    order.encryptedKeyCid = encryptedKeyCid;
    await order.save();
    return res.json({ success: true, data: { orderId: order.orderId, encryptedKeyCid: order.encryptedKeyCid } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to upload key' });
  }
});

// Buyer fetches encrypted key CID once released
router.get('/:orderId/key', requireWallet, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (!order.keyReleased) return res.status(403).json({ success: false, error: 'Key not released yet' });
    return res.json({ success: true, data: { encryptedKeyCid: order.encryptedKeyCid, keyReleasedAt: order.keyReleasedAt } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to get key' });
  }
});

// List open disputes (admin)
router.get('/disputes/list', async (_req, res) => {
  try {
    const items = await Order.find({ disputeStatus: 'open' }).limit(200).sort({ createdAt: -1 });
    return res.json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to list disputes' });
  }
});

// Get order by id (private)
router.get('/:orderId', optionalWallet, getOrderById)

// Seller marks file available (after uploading/exposing delivery)
router.post('/:orderId/fileAvailable', requireWallet, async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    // Basic auth: ensure caller is seller (match storefront wallet)
    // For MVP we accept the request if wallet present; production should verify storefront ownership
    const updated = await markFileAvailable(orderId);
    return res.json({ success: true, data: { orderId: updated.orderId, escrowState: updated.escrowState, releaseAt: updated.releaseAt } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to mark file available' });
  }
});

// Admin: force release escrow (admin UI should call this)
router.post('/:orderId/admin/release', async (req, res) => {
  try {
    const { orderId } = req.params;
    const updated = await releaseEscrow(orderId);
    return res.json({ success: true, data: { orderId: updated.orderId, status: updated.status } });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to release escrow' });
  }
});

export default router;