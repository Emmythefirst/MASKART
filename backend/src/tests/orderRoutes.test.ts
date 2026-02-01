import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import mongoose from 'mongoose';
import app from '../app.js';
import request from 'supertest';
import Product from '../models/Product.js';
import Storefront from '../models/Storefront.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://localhost:27017/MasKart-test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe('order routes', () => {
  it('creates order and fetches it', async () => {
    // create storefront and product
    await Storefront.create({ storeId: 'store-abc', storeName: 'Test Store', walletAddress: '4Nd1m3Q4kK1b6fgWqk4Q4p8v9Xf8aZptj1g1bWm1Yw1P' });
    await Product.create({
      productId: 'p-abc',
      storeId: 'store-abc',
      title: 'Test Product',
      description: 'desc',
      price: 10,
      currency: 'SOL',
      category: 'ebook',
      coverImage: 'cid',
      encryptedFileHash: 'efh',
      encryptedKey: 'ek',
      fileSize: 1024,
      fileName: 'file.pdf',
      fileType: 'application/pdf'
    });

    const buyerWallet = '4Nd1m3Q4kK1b6fgWqk4Q4p8v9Xf8aZptj1g1bWm1Yw1P';
    const txSignature = 'txsig-123';

    const res = await request(app)
      .post('/api/orders')
      .send({ productId: 'p-abc', buyerWallet, txSignature, walletAddress: buyerWallet });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const orderId = res.body.data.orderId;
    expect(orderId).toBeDefined();

    // Fetch order with requireWallet via query
    const getRes = await request(app).get(`/api/orders/${orderId}?walletAddress=${buyerWallet}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.success).toBe(true);
    expect(getRes.body.data.orderId).toBe(orderId);
  });
});
