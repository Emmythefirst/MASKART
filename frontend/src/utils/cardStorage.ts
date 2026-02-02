// client/src/utils/cardStorage.ts

/**
 * Single source of truth for card storage
 * Prevents JSON crashes, corrupted storage bugs, duplicated logic
 */

export interface StoredCard {
  orderId: string;
  amount: number;
  cardType: 'visa' | 'mastercard';
  email: string;
  card?: {
    number: string;
    cvv: string;
    expiry: string;
  };
  isMock?: boolean;
  status?: string;
  createdAt: string;
}

/**
 * Get all stored cards safely
 * @returns Array of cards (empty if none or corrupted)
 */
export function getStoredCards(): StoredCard[] {
  try {
    const raw = localStorage.getItem('ghost_commerce_card_orders');
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (error) {
    console.error('Failed to parse stored cards:', error);
    return [];
  }
}

/**
 * Check if user has any cards
 * @returns true if at least one card exists
 */
export function hasStoredCard(): boolean {
  return getStoredCards().length > 0;
}

/**
 * Get the latest (most recent) card
 * @returns Latest card or null if none exist
 */
export function getLatestCard(): StoredCard | null {
  const cards = getStoredCards();
  return cards.length > 0 ? cards[cards.length - 1] : null;
}

/**
 * Save a new card
 * @param card Card to save
 */
export function saveCard(card: StoredCard): void {
  const existing = getStoredCards();
  const updated = [...existing, card];
  localStorage.setItem('ghost_commerce_card_orders', JSON.stringify(updated));
}

/**
 * Clear all cards (use with caution!)
 */
export function clearCards(): void {
  localStorage.removeItem('ghost_commerce_card_orders');
}

/**
 * Update existing card data (e.g., when card details arrive)
 * @param orderId Order ID to update
 * @param updates Partial card data to merge
 */
export function updateCard(orderId: string, updates: Partial<StoredCard>): boolean {
  const cards = getStoredCards();
  const index = cards.findIndex(c => c.orderId === orderId);
  
  if (index === -1) return false;
  
  cards[index] = { ...cards[index], ...updates };
  localStorage.setItem('ghost_commerce_card_orders', JSON.stringify(cards));
  return true;
}