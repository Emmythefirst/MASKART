import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate unique store ID
 */
export const generateStoreId = (): string => {
  return `store_${uuidv4().substring(0, 12)}`;
};

/**
 * Generate unique product ID
 */
export const generateProductId = (): string => {
  return `prod_${uuidv4().substring(0, 12)}`;
};

/**
 * Generate unique order ID
 */
export const generateOrderId = (): string => {
  return `order_${uuidv4().substring(0, 12)}`;
};

/**
 * Generate download token
 */
export const generateDownloadToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Generate short unique ID (for URLs)
 */
export const generateShortId = (length: number = 8): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};