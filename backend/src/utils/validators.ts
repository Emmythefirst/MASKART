import { PublicKey } from '@solana/web3.js';

/**
 * Validate Solana wallet address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate price (must be positive)
 */
export const isValidPrice = (price: number): boolean => {
  return typeof price === 'number' && price > 0 && isFinite(price);
};

/**
 * Validate file type
 */
export const isAllowedFileType = (_mimetype: string, filename: string): boolean => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [];
  const fileExt = `.${filename.split('.').pop()?.toLowerCase()}`;
  return allowedTypes.includes(fileExt);
};

/**
 * Validate file size
 */
export const isValidFileSize = (size: number): boolean => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default
  return size > 0 && size <= maxSize;
};

/**
 * Validate email (optional contact info)
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate category
 */
export const isValidCategory = (category: string): boolean => {
  const validCategories = ['ebook', 'course', 'software', 'music', 'video', 'other'];
  return validCategories.includes(category);
};

/**
 * Validate currency
 */
export const isValidCurrency = (currency: string): boolean => {
  const validCurrencies = ['SOL', 'USDC'];
  return validCurrencies.includes(currency);
};