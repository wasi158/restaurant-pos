import type { MenuItem, Promotion } from './types';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function cartQtyMap(lines: Array<{ menuItemId: string; qty: number }>): Record<string, number> {
  const m: Record<string, number> = {};
  for (const l of lines) {
    const q = Math.floor(l.qty);
    if (q <= 0) continue;
    m[l.menuItemId] = (m[l.menuItemId] ?? 0) + q;
  }
  return m;
}

function applyPackageDeal(
  cartLines: Array<{ menuItemId: string; qty: number }>,
  menuBy: Record<string, MenuItem | undefined>,
  lines: { menuItemId: string; qty: number }[],
  bundlePrice: number
): number {
  const cart = cartQtyMap(cartLines);
  let b = Number.POSITIVE_INFINITY;
  for (const ln of lines) {
    const need = Math.max(1, Math.floor(ln.qty));
    const have = cart[ln.menuItemId] ?? 0;
    b = Math.min(b, Math.floor(have / need));
  }
  if (!Number.isFinite(b) || b < 0) b = 0;

  const rem = { ...cart };
  for (const ln of lines) {
    const need = Math.max(1, Math.floor(ln.qty));
    rem[ln.menuItemId] = Math.max(0, (rem[ln.menuItemId] ?? 0) - b * need);
  }

  let sub = b * Math.max(0, bundlePrice);
  for (const [menuItemId, qty] of Object.entries(rem)) {
    if (qty <= 0) continue;
    const mi = menuBy[menuItemId];
    if (mi) sub += mi.price * qty;
  }
  return round2(sub);
}

/**
 * Single active promotion: BOGO, percent/fixed off list, or a 3–4 item package bundle price.
 */
export function computeOrderPricing(
  cartLines: Array<{ menuItemId: string; qty: number }>,
  menuBy: Record<string, MenuItem | undefined>,
  taxRate: number,
  promotion: Promotion | null | undefined
): {
  grossSubtotal: number;
  discountTotal: number;
  subtotal: number;
  tax: number;
  total: number;
} {
  const lines = cartLines
    .map(l => ({ ...l, qty: Math.floor(l.qty) }))
    .filter(l => l.qty > 0);

  let gross = 0;
  for (const l of lines) {
    const m = menuBy[l.menuItemId];
    if (m) gross += m.price * l.qty;
  }
  gross = round2(gross);

  let subtotal = gross;
  if (promotion?.active) {
    if (promotion.kind === 'bogo_menu_item' && promotion.bogoMenuItemId) {
      subtotal = 0;
      for (const l of lines) {
        const m = menuBy[l.menuItemId];
        if (!m) continue;
        if (l.menuItemId === promotion.bogoMenuItemId) {
          const payQty = Math.ceil(l.qty / 2);
          subtotal += m.price * payQty;
        } else {
          subtotal += m.price * l.qty;
        }
      }
    } else if (promotion.kind === 'percent_off') {
      const p = Math.min(100, Math.max(0, Number(promotion.percent) || 0));
      subtotal = gross * (1 - p / 100);
    } else if (promotion.kind === 'fixed_off_order') {
      const off = Math.max(0, Number(promotion.fixedAmount) || 0);
      subtotal = Math.max(0, gross - off);
    } else if (promotion.kind === 'package_deal') {
      const pkgLines = promotion.lines ?? [];
      if (pkgLines.length >= 3 && pkgLines.length <= 4) {
        const ids = new Set(pkgLines.map(l => l.menuItemId));
        if (ids.size === pkgLines.length && pkgLines.every(l => menuBy[l.menuItemId])) {
          subtotal = applyPackageDeal(lines, menuBy, pkgLines, Number(promotion.bundlePrice) || 0);
        }
      }
    }
  }

  subtotal = round2(subtotal);
  const discountTotal = round2(gross - subtotal);
  const tax = round2(subtotal * taxRate);
  const total = round2(subtotal + tax);

  return { grossSubtotal: gross, discountTotal, subtotal, tax, total };
}
