/**
 * Validate Solana wallet address
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are 32-44 characters, base58 encoded
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate file size
 */
export function isValidFileSize(size: number, maxSizeMB: number = 50): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size > 0 && size <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return allowedTypes.includes(fileExtension);
}

/**
 * Validate image file
 */
export function isValidImage(file: File): boolean {
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return isValidFileType(file, allowedTypes);
}

/**
 * Validate price
 */
export function isValidPrice(price: number): boolean {
  return typeof price === 'number' && price > 0 && isFinite(price);
}

/**
 * Validate required field
 */
export function isRequired(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return true;
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string, 
  min?: number, 
  max?: number
): boolean {
  const length = value.length;
  if (min !== undefined && length < min) return false;
  if (max !== undefined && length > max) return false;
  return true;
}