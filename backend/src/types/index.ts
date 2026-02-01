import { Request } from 'express';

// Environment variables
export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  SOLANA_NETWORK: string;
  SOLANA_RPC_URL: string;
  ENCRYPTION_KEY: string;
  CORS_ORIGIN: string;
  MAX_FILE_SIZE: number;
  ALLOWED_FILE_TYPES: string;
  IPFS_GATEWAY: string;
  ORDER_EXPIRY_HOURS: number;
  DOWNLOAD_LINK_EXPIRY_HOURS: number;
}

// Storefront Types
export interface IStorefront {
  storeId: string;
  storeName: string;
  description?: string;
  walletAddress: string;
  encryptedContactInfo?: string;
  theme: {
    primaryColor: string;
    logoUrl?: string;
  };
  stats: {
    totalProducts: number;
    totalSales: number;
    totalRevenue: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Types
export interface IProduct {
  productId: string;
  storeId: string;
  title: string;
  description: string;
  price: number;
  currency: 'SOL' | 'USDC';
  category: 'ebook' | 'course' | 'software' | 'music' | 'video' | 'other';
  coverImage: string;
  encryptedFileHash: string;
  encryptedKey: string;
  fileSize: number;
  fileName: string;
  fileType: string;
  stats: {
    views: number;
    sales: number;
    revenue: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order Types
export interface IOrder {
  orderId: string;
  productId: string;
  storeId: string;
  buyerWalletHash: string;
  sellerId?: string;
  txSignature: string; // payment transaction signature or escrow reference
  escrowTx?: string; // optional escrow transaction or reference
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'failed';
  escrowState?: 'ESCROW_LOCKED' | 'FILE_AVAILABLE' | 'ESCROW_RELEASED' | 'DISPUTE_OPEN';
  disputeStatus?: 'none' | 'open' | 'resolved';
  disputeReason?: string;
  disputeOpenedAt?: Date;
  downloadToken?: string;
  downloadedAt?: Date;
  // Escrow timing fields
  escrowLockedAt?: Date;
  fileAvailableAt?: Date;
  releaseAt?: Date; // auto-release timestamp
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  encryptedKeyCid?: string;
  keyReleased?: boolean;
  keyReleasedAt?: Date;
}

// Review: immutable review anchored to an order
export interface IReview {
  reviewId: string;
  orderId: string;
  productId: string;
  sellerId: string;
  reviewerHash: string; // hashed buyer wallet
  rating: number;
  commentHash?: string; // hash or IPFS pointer to comment text
  isVerifiedPurchase: boolean;
  createdAt: Date;
}

// Review Types
export interface IReview {
  productId: string;
  orderId: string;
  reviewerHash: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Extended Request with wallet
export interface AuthRequest extends Request {
  walletAddress?: string;
}

// File Upload Types
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

// Payment Types
export interface PaymentIntent {
  orderId: string;
  amount: number;
  currency: string;
  recipientWallet: string;
}

export interface PaymentResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

// Seller identity - derived from seller wallet, used for reputation and cross-store identity
export interface ISellerIdentity {
  sellerId: string; // deterministic hash/fingerprint of wallet public key
  walletAddress: string;
  reputationScore: number;
  stats: {
    completedOrders: number;
    unresolvedDisputes: number;
    createdAt: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}