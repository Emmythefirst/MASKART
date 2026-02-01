import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import Order from '../models/Order.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/MasKart-test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

import { lockEscrow, markFileAvailable, releaseEscrow, processAutoReleases } from '../services/escrowService.js';

describe('escrowService', () => {
  it('locks, marks file available, and releases escrow (auto)', async () => {
    const order = await Order.create({
      orderId: 'test-order-1',
      productId: 'prod-1',
      storeId: 'store-1',
      buyerWalletHash: 'hash1',
      txSignature: 'tx1',
      amount: 100,
      currency: 'SOL',
      status: 'confirmed',
      escrowState: 'ESCROW_LOCKED',
      downloadToken: 'dt-1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    // lockEscrow should set escrowLockedAt (relayer may be unconfigured in test env)
    const locked = await lockEscrow(order.orderId, order.txSignature, order.amount, order.storeId);
    expect(locked.escrowLockedAt).toBeDefined();

    // mark file available sets releaseAt
    const fileAvail = await markFileAvailable(order.orderId);
    expect(fileAvail.escrowState).toBe('FILE_AVAILABLE');
    expect(fileAvail.releaseAt).toBeDefined();

    // Move releaseAt into the past and run auto releases
    await Order.updateOne({ orderId: order.orderId }, { $set: { releaseAt: new Date(Date.now() - 1000) } });
    await processAutoReleases();

    const after = await Order.findOne({ orderId: order.orderId });
    expect(after?.escrowState).toBe('ESCROW_RELEASED');
    expect(after?.status).toBe('delivered');
  });

  it('releaseEscrow marks keyReleased', async () => {
    const order = await Order.create({
      orderId: 'test-order-2',
      productId: 'prod-2',
      storeId: 'store-1',
      buyerWalletHash: 'hash2',
      txSignature: 'tx2',
      amount: 50,
      currency: 'SOL',
      status: 'confirmed',
      escrowState: 'ESCROW_LOCKED',
      downloadToken: 'dt-2',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    });

    const released = await releaseEscrow(order.orderId);
    expect(released.escrowState).toBe('ESCROW_RELEASED');
    expect(released.keyReleased).toBe(true);
    expect(released.keyReleasedAt).toBeDefined();
  });
});
