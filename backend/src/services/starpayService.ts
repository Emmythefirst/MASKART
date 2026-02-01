// Load dotenv at the top of this file
import dotenv from 'dotenv';
dotenv.config()

// backend/src/services/starpayService.ts

import axios from 'axios';
import { logger } from '../utils/logger.js';

const STARPAY_API_URL = process.env.STARPAY_API_URL || 'https://www.starpay.cards/api/v1';
const STARPAY_API_KEY = process.env.STARPAY_API_KEY;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';

// ✅ Use REAL devnet wallet for payments
const DEVNET_PAYMENT_WALLET = process.env.STARPAY_DEVNET_WALLET || process.env.MERCHANT_WALLET;

// Development mode active when on devnet OR no API key
const USE_MOCK_MODE = IS_DEVELOPMENT || SOLANA_NETWORK === 'devnet' || !STARPAY_API_KEY;

interface CardOrderRequest {
  amount: number;
  cardType: 'visa' | 'mastercard';
  email: string;
}

interface CardOrderResponse {
  orderId: string;
  status: string;
  payment: {
    address: string;
    amountSol: number;
    solPrice: number;
  };
  pricing: {
    cardValue: number;
    starpayFeePercent: number;
    starpayFee: number;
    resellerMarkup: number;
    total: number;
  };
  feeTier: string;
  expiresAt: string;
  checkStatusUrl: string;
  isMock?: boolean;
}

interface OrderStatusResponse {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  card?: {
    number: string;
    cvv: string;
    expiry: string;
  };
  createdAt: string;
  updatedAt: string;
  isMock?: boolean;
}

interface PricingResponse {
  cardValue: number;
  starpayFeePercent: number;
  starpayFee: number;
  resellerMarkup: number;
  total: number;
  feeTier: string;
}

// Mock card generator for development
function generateMockCard(cardType: 'visa' | 'mastercard') {
  const now = new Date();
  const expiry = new Date(now.setFullYear(now.getFullYear() + 3));
  
  const visaPrefix = '4532';
  const mcPrefix = '5425';
  
  const randomDigits = () => Math.floor(1000 + Math.random() * 9000).toString();
  const cardNumber = cardType === 'visa' 
    ? `${visaPrefix} ${randomDigits()} ${randomDigits()} ${randomDigits()}`
    : `${mcPrefix} ${randomDigits()} ${randomDigits()} ${randomDigits()}`;
  
  return {
    number: cardNumber,
    cvv: Math.floor(100 + Math.random() * 900).toString(),
    expiry: `${String(expiry.getMonth() + 1).padStart(2, '0')}/${expiry.getFullYear()}`
  };
}

// Generate mock order ID
function generateMockOrderId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 6);
}

// Calculate mock pricing
function calculateMockPricing(amount: number): PricingResponse {
  const cardValue = amount;
  const starpayFeePercent = 6.5;
  const starpayFee = (cardValue * starpayFeePercent) / 100;
  const resellerMarkup = 2;
  const total = cardValue + starpayFee + resellerMarkup;
  
  return {
    cardValue,
    starpayFeePercent,
    starpayFee: Number(starpayFee.toFixed(2)),
    resellerMarkup,
    total: Number(total.toFixed(2)),
    feeTier: amount >= 100 ? 'Premium' : 'Standard'
  };
}

class StarpayService {
  private isEnabled: boolean;
  private headers: Record<string, string>;
  private mockOrders: Map<string, OrderStatusResponse>;

  constructor() {
    this.isEnabled = !!STARPAY_API_KEY && !USE_MOCK_MODE;
    this.headers = {
      'Authorization': `Bearer ${STARPAY_API_KEY}`,
      'Content-Type': 'application/json'
    };
    this.mockOrders = new Map();

    if (USE_MOCK_MODE) {
      logger.warn('⚠️ Starpay MOCK MODE enabled (devnet/development)');
      logger.info('💳 Card issuance: SIMULATED');
      logger.info('💰 Payments: REAL DEVNET TRANSACTIONS');
      if (DEVNET_PAYMENT_WALLET) {
        logger.info(`📬 Payment wallet: ${DEVNET_PAYMENT_WALLET}`);
      } else {
        logger.error('❌ STARPAY_DEVNET_WALLET or MERCHANT_WALLET not configured!');
      }
    } else if (!this.isEnabled) {
      logger.warn('⚠️ Starpay API key not configured. Card issuance disabled.');
    } else {
      logger.info('✅ Starpay service initialized (PRODUCTION mode)');
    }
  }

  /**
   * Create a new card order (with mock support)
   */
  async createCardOrder(data: CardOrderRequest): Promise<CardOrderResponse> {
    // MOCK MODE for development/devnet
    if (USE_MOCK_MODE) {
      logger.info(`🎭 [MOCK] Creating card order: $${data.amount} ${data.cardType} for ${data.email}`);
      
      if (!DEVNET_PAYMENT_WALLET) {
        throw new Error('STARPAY_DEVNET_WALLET or MERCHANT_WALLET environment variable not set');
      }

      const orderId = generateMockOrderId();
      const pricing = calculateMockPricing(data.amount);
      
      // Get SOL price (mock)
      const solPrice = parseFloat(process.env.MOCK_SOL_PRICE || '188');
      const amountSol = pricing.total / solPrice;
      
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      
      const mockOrder: CardOrderResponse = {
        orderId,
        status: 'pending',
        payment: {
          address: DEVNET_PAYMENT_WALLET, // ✅ REAL devnet wallet!
          amountSol: Number(amountSol.toFixed(4)),
          solPrice
        },
        pricing,
        feeTier: pricing.feeTier,
        expiresAt: expiresAt.toISOString(),
        checkStatusUrl: `http://localhost:5000/api/starpay/cards/status/${orderId}`,
        isMock: true
      };
      
      // Store mock order with initial status
      this.mockOrders.set(orderId, {
        orderId,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isMock: true
      });
      
      logger.info(`✅ Mock order created: ${orderId}`);
      logger.info(`💰 Payment required: ${amountSol.toFixed(4)} SOL to ${DEVNET_PAYMENT_WALLET}`);
      
      return mockOrder;
    }

    // REAL MODE for production/mainnet
    if (!this.isEnabled) {
      throw new Error('Starpay is not configured');
    }

    try {
      logger.info(`Creating Starpay order: $${data.amount} ${data.cardType} card for ${data.email}`);

      const response = await axios.post<CardOrderResponse>(
        `${STARPAY_API_URL}/cards/order`,
        data,
        { headers: this.headers }
      );

      logger.info(`Starpay order created: ${response.data.orderId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Starpay order creation failed:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Starpay API key');
      } else if (error.response?.status === 400) {
        throw new Error(error.response?.data?.message || 'Invalid card order parameters');
      } else if (error.response?.status === 403) {
        throw new Error('Starpay account suspended');
      }
      
      throw new Error('Failed to create card order. Please try again.');
    }
  }

  /**
   * Complete card order after payment verification
   */
  async completeCardOrder(orderId: string): Promise<OrderStatusResponse> {
    if (USE_MOCK_MODE) {
      const existingOrder = this.mockOrders.get(orderId);
      
      if (!existingOrder) {
        throw new Error('Order not found');
      }

      logger.info(`🎭 [MOCK] Completing card order: ${orderId}`);
      
      // Generate mock card
      const card = generateMockCard('visa'); // Default to visa for now
      
      const completedOrder: OrderStatusResponse = {
        orderId,
        status: 'completed',
        card,
        createdAt: existingOrder.createdAt,
        updatedAt: new Date().toISOString(),
        isMock: true
      };
      
      this.mockOrders.set(orderId, completedOrder);
      
      logger.info(`✅ Mock card issued for order: ${orderId}`);
      
      return completedOrder;
    }

    // In production, Starpay would handle this via their API
    throw new Error('Production mode not implemented');
  }

  /**
   * Check order status (with mock support)
   */
  async checkOrderStatus(orderId: string): Promise<OrderStatusResponse> {
    // MOCK MODE
    if (USE_MOCK_MODE) {
      const mockOrder = this.mockOrders.get(orderId);
      
      if (!mockOrder) {
        throw new Error('Order not found');
      }
      
      logger.info(`🎭 [MOCK] Checking status for ${orderId}: ${mockOrder.status}`);
      return mockOrder;
    }

    // REAL MODE
    if (!this.isEnabled) {
      throw new Error('Starpay is not configured');
    }

    try {
      const response = await axios.get<OrderStatusResponse>(
        `${STARPAY_API_URL}/cards/order/status`,
        { 
          params: { orderId }, 
          headers: this.headers 
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Starpay status check failed:', error.response?.data || error.message);
      
      if (error.response?.status === 404) {
        throw new Error('Order not found');
      }
      
      throw new Error('Failed to check order status');
    }
  }

  /**
   * Get pricing for a card amount (with mock support)
   */
  async getCardPrice(amount: number): Promise<PricingResponse> {
    // MOCK MODE
    if (USE_MOCK_MODE) {
      logger.info(`🎭 [MOCK] Calculating pricing for $${amount}`);
      return calculateMockPricing(amount);
    }

    // REAL MODE
    if (!this.isEnabled) {
      throw new Error('Starpay is not configured');
    }

    try {
      const response = await axios.get<PricingResponse>(
        `${STARPAY_API_URL}/cards/price`,
        { 
          params: { amount }, 
          headers: this.headers 
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Starpay price check failed:', error.response?.data || error.message);
      throw new Error('Failed to get card pricing');
    }
  }

  /**
   * Check if Starpay is enabled
   */
  isServiceEnabled(): boolean {
    return this.isEnabled || USE_MOCK_MODE;
  }
  
  /**
   * Check if running in mock mode
   */
  isMockMode(): boolean {
    return USE_MOCK_MODE;
  }
}

// Export singleton instance
export const starpayService = new StarpayService();

export default starpayService;