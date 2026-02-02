// Product Categories
export const PRODUCT_CATEGORIES = [
  { value: 'ebook', label: 'E-book' },
  { value: 'course', label: 'Course' },
  { value: 'software', label: 'Software' },
  { value: 'music', label: 'Music' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Other' },
] as const;

// Currencies
export const CURRENCIES = [
  { value: 'SOL', label: 'SOL', symbol: '◎' },
  { value: 'USDC', label: 'USDC', symbol: '$' },
] as const;

// File Upload Limits
export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,  // 5MB
  ALLOWED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  ALLOWED_FILE_TYPES: [
    '.pdf', '.epub', '.zip', '.mp4', '.mp3', 
    '.png', '.jpg', '.jpeg', '.gif'
  ],
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  DELIVERED: 'delivered',
  FAILED: 'failed',
} as const;

// Solana Network
export const SOLANA_NETWORKS = {
  MAINNET: 'mainnet-beta',
  DEVNET: 'devnet',
  TESTNET: 'testnet',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  STOREFRONT: '/storefront',
  PRODUCTS: '/products',
  ORDERS: '/orders',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  THEME: 'ghost-commerce-theme',
  LAST_WALLET: 'ghost-commerce-last-wallet',
  DRAFT_PRODUCT: 'ghost-commerce-draft-product',
} as const;

// Routes
export const ROUTES = {
  HOME: '/',
  CREATE_STORE: '/create-store',
  STOREFRONT: '/store/:storeId',
  PRODUCT: '/product/:productId',
  DASHBOARD: '/dashboard',
  DOWNLOAD: '/download/:token',
} as const;

// Feature Flags
export const FEATURES = {
  PRIVACY_CASH_ENABLED: true, // Will enable when integrated
  IPFS_ENABLED: false,          // Will enable with Pinata keys
  REVIEWS_ENABLED: false,       // Future feature
  SEARCH_ENABLED: false,        // Future feature
} as const;