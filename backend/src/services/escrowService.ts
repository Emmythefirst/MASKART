import Order from '../models/Order.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

const AUTO_RELEASE_HOURS = parseInt(process.env.ESCROW_AUTO_RELEASE_HOURS || '24');
const RELAYER_URL = process.env.PRIVACY_CASH_RELAYER_URL || process.env.RELAYER_URL || '';

async function callRelayer(path: string, body: any) {
  if (!RELAYER_URL) {
    logger.warn('RELAYER_URL not set; skipping relayer call');
    return null;
  }
  try {
    const url = `${RELAYER_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
    const res = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' } });
    return res.data;
  } catch (e: any) {
    logger.error('Relayer call failed', e?.message || e);
    throw e;
  }
}

export async function lockEscrow(orderId: string, txSignature: string, amount: number, recipient?: string) {
  // Call relayer to record/lock the escrow associated with this order
  const order = await Order.findOne({ orderId });
  if (!order) throw new Error('Order not found');
  try {
    const resp = await callRelayer('lock', { orderId, txSignature, amount, recipient });
    if (resp && resp.escrowTx) {
      order.escrowTx = resp.escrowTx;
    }
    order.escrowLockedAt = new Date();
    await order.save();
    logger.info(`Locked escrow for order ${orderId}`);
    return order;
  } catch (e) {
    logger.error('Failed to lock escrow', e);
    // Keep order created but without escrowTx — caller can retry
    return order;
  }
}

export async function markFileAvailable(orderId: string) {
  const order = await Order.findOne({ orderId });
  if (!order) throw new Error('Order not found');
  order.escrowState = 'FILE_AVAILABLE';
  order.fileAvailableAt = new Date();
  order.releaseAt = new Date(Date.now() + AUTO_RELEASE_HOURS * 60 * 60 * 1000);
  await order.save();
  logger.info(`Order ${orderId} file available; auto-release at ${order.releaseAt}`);
  return order;
}

export async function releaseEscrow(orderId: string) {
  const order = await Order.findOne({ orderId });
  if (!order) throw new Error('Order not found');
  try {
    // Call relayer to release funds (if configured)
    await callRelayer('release', { orderId, escrowTx: order.escrowTx });
  } catch (e) {
    logger.warn('Relayer release failed or not configured', e);
  }
  order.escrowState = 'ESCROW_RELEASED';
  order.status = 'delivered';
  order.keyReleased = true;
  order.keyReleasedAt = new Date();
  await order.save();
  logger.info(`Order ${orderId} escrow released`);
  return order;
}

export async function openDispute(orderId: string, reason?: string) {
  const order = await Order.findOne({ orderId });
  if (!order) throw new Error('Order not found');
  if (order.disputeStatus === 'open') throw new Error('Dispute already open');

  order.disputeStatus = 'open';
  order.escrowState = 'DISPUTE_OPEN';
  order.disputeReason = reason || 'No reason provided';
  order.disputeOpenedAt = new Date();
  
  await order.save();
  
  // TODO: Notify admins, lock funds, record evidence
  
  return order;
}

export async function processAutoReleases() {
  // Find orders where file is available and releaseAt passed and not yet released or disputed
  const now = new Date();
  const candidates = await Order.find({
    escrowState: 'FILE_AVAILABLE',
    releaseAt: { $lte: now },
    disputeStatus: 'none'
  });
  for (const order of candidates) {
    try {
      // Attempt relayer release
      try {
        await callRelayer('release', { orderId: order.orderId, escrowTx: order.escrowTx });
      } catch (e) {
        logger.warn('Auto-release relayer call failed', e);
      }
      order.escrowState = 'ESCROW_RELEASED';
      order.status = 'delivered';
      await order.save();
      logger.info(`Auto-released escrow for order ${order.orderId}`);
    } catch (e) {
      logger.error(`Auto-release failed for order ${order.orderId}`, e);
    }
  }
}
