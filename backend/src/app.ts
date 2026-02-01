// Express application setup for MasKart backend
// - Registers middleware, health route, and API route mounting points.
// - Product routes are enabled so the frontend can fetch public product listings.

// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();


import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler.js';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'OK', 
    message: 'MasKart API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API info route
app.get('/api', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to MasKart API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      storefront: '/api/storefront',
      products: '/api/products',
      orders: '/api/orders'
    }
  });
});

// Import routes
import storefrontRoutes from './routes/storefront.js';
import productRoutes from './routes/product.js';
import sellerRoutes from './routes/sellerIdentity.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/order.js';
import starpayRoutes from './routes/starpay.js';
import reviewRoutes from './routes/review.js';
import cardTransactionRoutes from './routes/cardTransaction.js';
import { processAutoReleases } from './services/escrowService.js';

// API Routes
app.use('/api/storefront', storefrontRoutes);
app.use('/api/products', productRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/starpay', starpayRoutes);
app.use('/api/card', cardTransactionRoutes);
// app.use('/api/orders', orderRoutes);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path 
  });
});

export default app;

// Background job: process escrow auto-releases every 5 minutes
setInterval(async () => {
  try {
    await processAutoReleases();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error processing auto-releases', e);
  }
}, 5 * 60 * 1000);