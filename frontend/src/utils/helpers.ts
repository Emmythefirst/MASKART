/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * Download file from URL
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncate text
 */
export function truncate(text: string, length: number, suffix: string = '...'): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + suffix;
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return '.' + filename.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if mobile device
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Get IPFS URL
 */
export function getIPFSUrl(hash: string): string {
  const gateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
  return `${gateway}${hash}`;
}

/**
 * Parse error message from API response
 */
export function parseErrorMessage(error: any): string {
  if (typeof error === 'string') return error;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message) return error.message;
  return 'An unexpected error occurred';
}