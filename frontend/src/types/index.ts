// Storefront Types
export interface Storefront {
  storeId: string;
  storeName: string;
  description?: string;
  walletAddress: string;
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
  createdAt: string;
  updatedAt: string;
}

// Product Types
export interface Product {
  productId: string;
  storeId: string;
  title: string;
  description: string;
  price: number;
  currency: 'SOL' | 'USDC';
  category: 'ebook' | 'course' | 'software' | 'music' | 'video' | 'other';
  coverImage: string;
  encryptedFileHash: string;
  fileSize: number;
  fileName: string;
  fileType: string;
  stats: {
    views: number;
    sales: number;
    revenue: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order Types
export interface Order {
  orderId: string;
  productId: string;
  storeId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'delivered' | 'failed';
  downloadToken?: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  keyReleased?: boolean;
  encryptedKeyCid?: string;
  txSignature: string;        // Solana tx hash
  escrowState: EscrowState;
}

export enum EscrowState {
  PENDING = 'PENDING',     // Order created, payment not verified yet
  LOCKED = 'LOCKED',       // Payment verified & locked
  FUNDED = 'FUNDED',       // Buyer paid, funds locked in escrow
  DELIVERED = 'DELIVERED', // Seller delivered encrypted file
  RELEASED = 'RELEASED',   // Funds released to seller
  REFUNDED = 'REFUNDED',   // Buyer refunded
  DISPUTED = 'DISPUTED',   // Optional: dispute opened
}


// Review Types
export interface Review {
  productId: string;
  orderId: string;
  rating: number;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface CreateStorefrontForm {
  storeName: string;
  description?: string;
  primaryColor: string;
}

export interface CreateProductForm {
  title: string;
  description: string;
  price: number;
  currency: 'SOL' | 'USDC';
  category: 'ebook' | 'course' | 'software' | 'music' | 'video' | 'other';
  coverImage: File | null;
  productFile: File | null;
}

// Wallet Context Types
export interface WalletContextType {
  connected: boolean;
  publicKey: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

// Environment Variables
export interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SOLANA_NETWORK: string;
  readonly VITE_SOLANA_RPC_URL: string;
}

export interface ImportMeta {
  readonly env: ImportMetaEnv;
}