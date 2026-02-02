// API client wrapper
// - Centralized axios instance used across the frontend to communicate with the backend API.
// - Exposes helper objects: `storefrontAPI`, `productAPI`, `orderAPI`, `paymentAPI`, etc.
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { ApiResponse, Storefront, Product, Order } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// ==================== STOREFRONT API ====================
export const storefrontAPI = {
  /**
   * Create a new storefront
   */
  create: async (data: {
    storeName: string;
    description?: string;
    walletAddress: string;
    contactInfo?: string;
    primaryColor?: string;
  }): Promise<ApiResponse<Storefront>> => {
    const response = await apiClient.post('/storefront', data);
    return response.data;
  },

  /**
   * Get storefront by ID
   */
  getById: async (storeId: string): Promise<ApiResponse<Storefront>> => {
    const response = await apiClient.get(`/storefront/${storeId}`);
    return response.data;
  },

  /**
   * Get storefront by wallet address
   */
  getByWallet: async (walletAddress: string): Promise<ApiResponse<Storefront>> => {
    const response = await apiClient.get(`/storefront/wallet/${walletAddress}`);
    return response.data;
  },

  /**
   * Update storefront
   */
  update: async (
    storeId: string,
    data: {
      storeName?: string;
      description?: string;
      primaryColor?: string;
      walletAddress: string;
    }
  ): Promise<ApiResponse<Storefront>> => {
    const response = await apiClient.put(`/storefront/${storeId}`, data);
    return response.data;
  },
};

// ==================== PRODUCT API ====================
export const productAPI = {
  /**
   * Create a new product with file uploads
   */
  create: async (formData: FormData): Promise<ApiResponse<Product>> => {
    const response = await apiClient.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all products for a store
   */
  getStoreProducts: async (storeId: string): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get(`/products/store/${storeId}`);
    return response.data;
  },

  /**
   * Get all active products
   */
  getAllProducts: async (): Promise<ApiResponse<Product[]>> => {
    const response = await apiClient.get(`/products`);
    return response.data;
  },

  /**
   * Get single product by ID
   */
  getById: async (productId: string): Promise<ApiResponse<Product>> => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
  },

  /**
   * Update product
   */
  update: async (
    productId: string,
    data: {
      title?: string;
      description?: string;
      price?: number;
      walletAddress: string;
    }
  ): Promise<ApiResponse<Product>> => {
    const response = await apiClient.put(`/products/${productId}`, data);
    return response.data;
  },

  /**
   * Delete product (soft delete)
   */
  delete: async (productId: string, walletAddress: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/products/${productId}`, {
      data: { walletAddress },
    });
    return response.data;
  },
};

// ==================== ORDER API ====================
export const orderAPI = {
  /**
   * Create order after payment
   */
  create: async (data: {
    productId: string;
    buyerWallet: string;
    txSignature: string;
  }): Promise<ApiResponse<Order>> => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  /**
   * Get order by download token
   */
  getByToken: async (downloadToken: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.get(`/orders/download/${downloadToken}`);
    return response.data;
  },

  /**
   * Get order by id (private)
   */
  getById: async (orderId: string): Promise<ApiResponse<Order>> => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Download product file
   */
  download: async (downloadToken: string): Promise<ApiResponse> => {
    const response = await apiClient.post(`/orders/download/${downloadToken}`);
    return response.data;
  },

  /**
   * Get buyer's order history
   */
  getBuyerOrders: async (walletAddress: string): Promise<ApiResponse<Order[]>> => {
    const response = await apiClient.get(`/orders/buyer/${walletAddress}`);
    return response.data;
  },
  confirm: async (orderId: string, buyerWallet: string) => {
    const response = await apiClient.post(`/orders/${orderId}/confirm`, { buyerWallet });
    return response.data;
  },
  dispute: async (orderId: string, buyerWallet: string, reason: string) => {
    const response = await apiClient.post(`/orders/${orderId}/dispute`, { buyerWallet, reason });
    return response.data;
  },
  markFileAvailable: async (orderId: string) => {
    const response = await apiClient.post(`/orders/${orderId}/fileAvailable`);
    return response.data;
  },
  adminRelease: async (orderId: string) => {
    const response = await apiClient.post(`/orders/${orderId}/admin/release`);
    return response.data;
  }
};

// Key endpoints
export const keyAPI = {
  uploadKey: async (orderId: string, encryptedKeyCid: string) => {
    const response = await apiClient.post(`/orders/${orderId}/upload-key`, { encryptedKeyCid });
    return response.data;
  },
  getKey: async (orderId: string) => {
    const response = await apiClient.get(`/orders/${orderId}/key`);
    return response.data;
  },
  listDisputes: async () => {
    const response = await apiClient.get(`/orders/disputes/list`);
    return response.data;
  }
};

// ==================== PAYMENT API ====================
export const paymentAPI = {
  createIntent: async (data: { productId: string; buyerWallet?: string }) => {
    const response = await apiClient.post('/payment/intent', data);
    return response.data;
  },
  confirm: async (data: { intentId: string; txSignature: string }) => {
    const response = await apiClient.post('/payment/confirm', data);
    return response.data;
  }
};

// ==================== HEALTH CHECK ====================
export const healthAPI = {
  /**
   * Check API health
   */
  check: async (): Promise<ApiResponse> => {
    const response = await axios.get('http://localhost:5000/health');
    return response.data;
  },
};

// ==================== STARPAY API ====================
export const starpayAPI = {
  // Create card order
  createCardOrder: async (data: { amount: number; cardType: string; email: string, walletAddress?: string }) => {
    const response = await apiClient.post('/starpay/cards/order', data);
    return response.data;
  },

  // Check order status
  checkOrderStatus: async (orderId: string) => {
    const response = await apiClient.get(`/starpay/cards/status/${orderId}`);
    return response.data;
  },

  // Get card pricing
  getCardPrice: async (amount: number) => {
    const response = await apiClient.get('/starpay/cards/price', {
      params: { amount }
    });
    return response.data;
  },

  // ✅ NEW: Verify payment and complete card order
  verifyPayment: async (orderId: string, signature: string) => {
    const response = await apiClient.post(`/starpay/cards/verify-payment/${orderId}`, {
      signature
    });
    return response.data;
  },

  // Check Starpay status
  getStatus: async () => {
    const response = await apiClient.get('/starpay/status');
    return response.data;
  }
};
 /**
 * Card Transaction API
 */
export const cardAPI = {
  // Get card balance
  getBalance: async (cardOrderId: string) => {
    const response = await apiClient.get(`/card/${cardOrderId}/balance`);
    return response.data;
  },

  // Get card transactions
  getTransactions: async (cardOrderId: string, limit = 50) => {
    const response = await apiClient.get(`/card/${cardOrderId}/transactions`, {
      params: { limit }
    });
    return response.data;
  },

  // Top up card
  topUp: async (cardOrderId: string, amount: number, walletAddress: string) => {
    const response = await apiClient.post(`/card/${cardOrderId}/topup`, {
      amount,
      walletAddress
    });
    return response.data;
  },

  // Withdraw from card
  withdraw: async (cardOrderId: string, amount: number, walletAddress: string) => {
    const response = await apiClient.post(`/card/${cardOrderId}/withdraw`, {
      amount,
      walletAddress
    });
    return response.data;
  },

  // Mock purchase (for testing)
  mockPurchase: async (cardOrderId: string, merchant: string, amount: number, status = 'completed') => {
    const response = await apiClient.post(`/card/${cardOrderId}/mock-purchase`, {
      merchant,
      amount,
      status
    });
    return response.data;
  }
}

export default apiClient;