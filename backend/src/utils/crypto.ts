import CryptoJS from 'crypto-js';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this-immediately!!';

/**
 * Encrypt data using AES-256
 */
export const encrypt = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt data using AES-256
 */
export const decrypt = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Generate a random encryption key for files
 */
export const generateFileKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash wallet address for privacy
 */
export const hashWallet = (walletAddress: string): string => {
  return CryptoJS.SHA256(walletAddress).toString();
};

/**
 * Generate a secure random token
 */
export const generateToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypt file buffer
 */
export const encryptFile = (buffer: Buffer, key: string): Buffer => {
  const algorithm = 'aes-256-cbc';
  // Derive a proper 32-byte key from the input key
  const keyBuffer = crypto.scryptSync(key, 'SALT', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // Prepend IV to encrypted data so we can decrypt later
  return Buffer.concat([iv, encrypted]);
};

/**
 * Decrypt file buffer
 */
export const decryptFile = (encryptedBuffer: Buffer, key: string): Buffer => {
  const algorithm = 'aes-256-cbc';
  const keyBuffer = crypto.scryptSync(key, 'SALT', 32);
  
  // Extract IV from the beginning of the encrypted buffer
  const iv = encryptedBuffer.subarray(0, 16);
  const encrypted = encryptedBuffer.subarray(16);
  
  const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};