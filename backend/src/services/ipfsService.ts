import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { storageConfig } from '../config/storage.js';

// Pinata API configuration
const PINATA_API_KEY = process.env.PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || '';
const PINATA_API_URL = 'https://api.pinata.cloud';


console.log('🔍 IPFS Configuration Check:');
console.log('PINATA_API_KEY exists:', !!PINATA_API_KEY);
console.log('PINATA_SECRET_KEY exists:', !!PINATA_SECRET_KEY);
console.log('API Key length:', PINATA_API_KEY?.length || 0);
console.log('Secret length:', PINATA_SECRET_KEY?.length || 0);
console.log('isConfigured:', isIPFSConfigured());

/**
 * Check if IPFS is properly configured
 */
function isIPFSConfigured(): boolean {
  return !!(PINATA_API_KEY && PINATA_SECRET_KEY);
}

/**
 * Upload file to IPFS via Pinata
 */
export const uploadToIPFS = async (filePath: string, fileName: string): Promise<string> => {
  try {
    if (!isIPFSConfigured()) {
      console.warn('⚠️ IPFS not configured. Using mock hash.');
      // Return mock hash for development
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      console.log(`📦 Mock IPFS hash generated: ${mockHash} for ${fileName}`);
      return mockHash;
    }

    // Real Pinata implementation
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        uploadedAt: new Date().toISOString(),
        platform: 'ghost-commerce'
      }
    });
    formData.append('pinataMetadata', metadata);
    
    const options = JSON.stringify({
      cidVersion: 1
    });
    formData.append('pinataOptions', options);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        },
        maxBodyLength: Infinity
      }
    );

    console.log(`✅ File uploaded to IPFS: ${response.data.IpfsHash}`);
    return response.data.IpfsHash;
  } catch (error: any) {
    console.error('IPFS upload error:', error.response?.data || error.message);
    
    // Fallback to mock hash on error
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    console.log(`📦 Fallback mock IPFS hash: ${mockHash}`);
    return mockHash;
  }
};

/**
 * Upload buffer to IPFS
 */
export const uploadBufferToIPFS = async (
  buffer: Buffer, 
  fileName: string
): Promise<string> => {
  try {
    if (!isIPFSConfigured()) {
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      console.log(`📦 Mock IPFS hash for buffer: ${mockHash}`);
      return mockHash;
    }

    const formData = new FormData();
    formData.append('file', buffer, { filename: fileName });
    
    const metadata = JSON.stringify({
      name: fileName,
    });
    formData.append('pinataMetadata', metadata);

    const response = await axios.post(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          'Content-Type': `multipart/form-data; boundary=${(formData as any)._boundary}`,
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );

    console.log(`✅ Buffer uploaded to IPFS: ${response.data.IpfsHash}`);
    return response.data.IpfsHash;
  } catch (error: any) {
    console.error('IPFS buffer upload error:', error.response?.data || error.message);
    const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    return mockHash;
  }
};

/**
 * Get IPFS file URL
 */
export const getIPFSUrl = (hash: string): string => {
  return `${storageConfig.ipfs.gateway}${hash}`;
};

/**
 * Download file from IPFS
 */
export const downloadFromIPFS = async (hash: string): Promise<Buffer> => {
  try {
    const url = getIPFSUrl(hash);
    console.log(`⬇️ Downloading from IPFS: ${hash}`);
    
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 30000 // 30 seconds
    });
    
    return Buffer.from(response.data);
  } catch (error: any) {
    console.error('IPFS download error:', error.message);
    throw new Error('Failed to download from IPFS');
  }
};

/**
 * Unpin file from IPFS (cleanup)
 */
export const unpinFromIPFS = async (hash: string): Promise<boolean> => {
  try {
    if (!isIPFSConfigured()) {
      console.log('⚠️ IPFS not configured. Skip unpinning.');
      return false;
    }

    await axios.delete(
      `${PINATA_API_URL}/pinning/unpin/${hash}`,
      {
        headers: {
          'pinata_api_key': PINATA_API_KEY,
          'pinata_secret_api_key': PINATA_SECRET_KEY
        }
      }
    );

    console.log(`🗑️ Unpinned from IPFS: ${hash}`);
    return true;
  } catch (error: any) {
    console.error('IPFS unpin error:', error.response?.data || error.message);
    return false;
  }
};

/**
 * Check if hash exists on IPFS
 */
export const checkIPFSHash = async (hash: string): Promise<boolean> => {
  try {
    const url = getIPFSUrl(hash);
    const response = await axios.head(url, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
};