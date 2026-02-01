import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Storage configuration
 */
export const storageConfig = {
  // Upload directory
  uploadDir: path.join(__dirname, '../../uploads'),
  
  // Maximum file size (50MB)
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800'),
  
  // Allowed file types
  allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || '.pdf,.epub,.zip,.mp4,.mp3,.png,.jpg,.jpeg,.gif').split(','),
  
  // IPFS configuration
  ipfs: {
    gateway: process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/',
    apiUrl: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001/api/v0',
  },
  
  // Pinata configuration (for IPFS pinning)
  pinata: {
    apiKey: process.env.PINATA_API_KEY || '',
    secretKey: process.env.PINATA_SECRET_KEY || '',
  },
};

/**
 * Get upload directory path
 */
export function getUploadDir(): string {
  return storageConfig.uploadDir;
}

/**
 * Get maximum file size
 */
export function getMaxFileSize(): number {
  return storageConfig.maxFileSize;
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(fileExtension: string): boolean {
  return storageConfig.allowedFileTypes.includes(fileExtension.toLowerCase());
}

/**
 * Get IPFS gateway URL
 */
export function getIPFSGateway(): string {
  return storageConfig.ipfs.gateway;
}

/**
 * Get full IPFS URL for hash
 */
export function getIPFSUrl(hash: string): string {
  return `${storageConfig.ipfs.gateway}${hash}`;
}

export default storageConfig;