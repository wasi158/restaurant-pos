import type { InventoryItem } from './types';

export type ExpiryStatus = 'expired' | 'expiring_soon' | 'ok' | 'no_date';

const MS_PER_DAY = 86_400_000;
const EXPIRING_SOON_DAYS = 3;

export function daysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate + 'T00:00:00');
  return Math.ceil((exp.getTime() - now.getTime()) / MS_PER_DAY);
}

export function getExpiryStatus(item: InventoryItem): ExpiryStatus {
  if (!item.expiryDate) return 'no_date';
  const days = daysUntilExpiry(item.expiryDate);
  if (days < 0) return 'expired';
  if (days <= EXPIRING_SOON_DAYS) return 'expiring_soon';
  return 'ok';
}

export function expiryLabel(item: InventoryItem): string {
  if (!item.expiryDate) return '—';
  const days = daysUntilExpiry(item.expiryDate);
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  if (days <= EXPIRING_SOON_DAYS) return `Expires in ${days}d`;
  return new Date(item.expiryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getExpiringItems(inventory: InventoryItem[]): InventoryItem[] {
  return inventory.filter(i => {
    const s = getExpiryStatus(i);
    return s === 'expired' || s === 'expiring_soon';
  }).sort((a, b) => daysUntilExpiry(a.expiryDate!) - daysUntilExpiry(b.expiryDate!));
}
