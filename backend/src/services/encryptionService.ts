import fs from 'fs/promises';
import { encrypt, decrypt, generateFileKey, encryptFile, decryptFile } from '../utils/crypto.js';

/**
 * Encrypt a file and return encrypted buffer + key
 */
export const encryptProductFile = async (filePath: string): Promise<{ 
  encryptedBuffer: Buffer; 
  encryptionKey: string;
}> => {
  try {
    // Read original file
    const fileBuffer = await fs.readFile(filePath);
    
    // Generate unique encryption key for this file
    const encryptionKey = generateFileKey();
    
    // Encrypt file
    const encryptedBuffer = encryptFile(fileBuffer, encryptionKey);
    
    console.log(`✅ File encrypted: ${filePath.split('/').pop()} (${fileBuffer.length} bytes → ${encryptedBuffer.length} bytes)`);
    
    return {
      encryptedBuffer,
      encryptionKey
    };
  } catch (error) {
    console.error('File encryption error:', error);
    throw new Error('Failed to encrypt file');
  }
};

/**
 * Decrypt a file using provided key
 */
export const decryptProductFile = async (
  encryptedBuffer: Buffer, 
  encryptionKey: string
): Promise<Buffer> => {
  try {
    const decryptedBuffer = decryptFile(encryptedBuffer, encryptionKey);
    console.log(`✅ File decrypted: ${encryptedBuffer.length} bytes → ${decryptedBuffer.length} bytes`);
    return decryptedBuffer;
  } catch (error) {
    console.error('File decryption error:', error);
    throw new Error('Failed to decrypt file');
  }
};

/**
 * Encrypt the encryption key itself (double encryption)
 */
export const encryptKey = (key: string): string => {
  return encrypt(key);
};

/**
 * Decrypt the encryption key
 */
export const decryptKey = (encryptedKey: string): string => {
  return decrypt(encryptedKey);
};

/**
 * Delete temporary file after processing
 */
export const deleteTempFile = async (filePath: string): Promise<void> => {
  try {
    await fs.unlink(filePath);
    console.log(`🗑️ Deleted temp file: ${filePath.split('/').pop()}`);
  } catch (error) {
    console.error('Failed to delete temp file:', error);
  }
};

/**
 * Save encrypted file to disk
 */
export const saveEncryptedFile = async (
  encryptedBuffer: Buffer,
  filename: string
): Promise<string> => {
  try {
    const filepath = `uploads/encrypted/${filename}`;
    await fs.writeFile(filepath, encryptedBuffer);
    console.log(`💾 Saved encrypted file: ${filename}`);
    return filepath;
  } catch (error) {
    console.error('Save encrypted file error:', error);
    throw new Error('Failed to save encrypted file');
  }
};

/**
 * Read encrypted file from disk
 */
export const readEncryptedFile = async (filepath: string): Promise<Buffer> => {
  try {
    const buffer = await fs.readFile(filepath);
    return buffer;
  } catch (error) {
    console.error('Read encrypted file error:', error);
    throw new Error('Failed to read encrypted file');
  }
};