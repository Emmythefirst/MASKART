import CryptoJS from 'crypto-js';

/**
 * Encrypt data using AES-256
 */
export function encrypt(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypt data using AES-256
 */
export function decrypt(encryptedData: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Hash data using SHA-256
 */
export function hash(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Generate random key
 */
export function generateKey(length: number = 32): string {
  return CryptoJS.lib.WordArray.random(length).toString();
}

/**
 * Encrypt file (browser-compatible)
 */
export async function encryptFile(file: File, key: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
  const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
  return new Blob([encrypted], { type: 'application/octet-stream' });
}

/**
 * Decrypt file (browser-compatible)
 */
export async function decryptFile(encryptedBlob: Blob, key: string): Promise<Blob> {
  const encryptedText = await encryptedBlob.text();
  const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
  const typedArray = convertWordArrayToUint8Array(decrypted);
  // Ensure we pass an ArrayBuffer to Blob to avoid SharedArrayBuffer typing issues
  return new Blob([typedArray.buffer as ArrayBuffer]);
}

/**
 * Convert WordArray to Uint8Array (helper for file decryption)
 */
function convertWordArrayToUint8Array(wordArray: CryptoJS.lib.WordArray): Uint8Array {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const u8 = new Uint8Array(sigBytes);
  
  for (let i = 0; i < sigBytes; i++) {
    u8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
  }
  
  return u8;
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}