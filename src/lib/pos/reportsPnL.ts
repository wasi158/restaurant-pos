import reportsJson from '../../mock/reports.json';
type Period = (typeof reportsJson.periods)[number];
import type { InventoryItem, InventoryUsage, PosStateV1 } from './types';
import { byId } from './selectors';
import { convertQty } from './units';
import type { Unit } from './units';

export type PnLSummary = {
  period: Period;
  rangeLabel: string;
  orderCount: number;
  /** Sum of line-item qty (covers proxy) */
  itemsSold: number;
  /** Pre-tax food & beverage sales */
  revenueSubtotal: number;
  taxCollected: number;
  totalCollected: number;
  /** From inventory usage × current inventory unit cost */
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Monday-start week containing `d` */
function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function startOfMonth(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfYear(d: Date): Date {
  const x = new Date(d.getFullYear(), 0, 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function periodRange(period: Period, now = new Date()): { start: Date; end: Date; label: string } {
  const end = now;
  switch (period) {
    case 'Today': {
      const start = startOfDay(now);
      return { start, end, label: `${start.toLocaleDateString()} (local)` };
    }
    case 'This Week': {
      const start = startOfWeekMonday(now);
      return { start, end, label: `Week of ${start.toLocaleDateString()}` };
    }
    case 'This Month': {
      const start = startOfMonth(now);
      return { start, end, label: `${start.toLocaleString('default', { month: 'long', year: 'numeric' })}` };
    }
    case 'This Year': {
      const start = startOfYear(now);
      return { start, end, label: `${start.getFullYear()}` };
    }
    default:
      return { start: startOfDay(now), end, label: '' };
  }
}

function inRange(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function cogsForUsage(usage: InventoryUsage[], orderIds: Set<string>, invBy: Record<string, InventoryItem>): number {
  let sum = 0;
  for (const u of usage) {
    if (!orderIds.has(u.orderId)) continue;
    const inv = invBy[u.inventoryId];
    if (!inv) continue;
    let qtyInInvUnit: number;
    try {
      qtyInInvUnit = convertQty(u.quantity, u.unit as Unit, inv.unit);
    } catch {
      continue;
    }
    sum += qtyInInvUnit * inv.costPerUnit;
  }
  return Math.round(sum * 100) / 100;
}

export function computePnL(state: PosStateV1, period: Period, now = new Date()): PnLSummary {
  const { start, end, label } = periodRange(period, now);
  const orders = state.orders.filter(o => inRange(o.createdAtIso, start, end));
  const orderIds = new Set(orders.map(o => o.id));

  const revenueSubtotal = orders.reduce((s, o) => s + o.subtotal, 0);
  const taxCollected = orders.reduce((s, o) => s + o.tax, 0);
  const totalCollected = orders.reduce((s, o) => s + o.total, 0);

  let itemsSold = 0;
  for (const o of orders) {
    for (const it of o.items) itemsSold += it.qty;
  }

  const invBy = byId(state.inventory);
  const cogs = cogsForUsage(state.usage, orderIds, invBy);
  const grossProfit = Math.round((revenueSubtotal - cogs) * 100) / 100;
  const grossMarginPct = revenueSubtotal > 0 ? Math.round((grossProfit / revenueSubtotal) * 10_000) / 100 : 0;

  return {
    period,
    rangeLabel: label,
    orderCount: orders.length,
    itemsSold,
    revenueSubtotal: Math.round(revenueSubtotal * 100) / 100,
    taxCollected: Math.round(taxCollected * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    cogs,
    grossProfit,
    grossMarginPct,
  };
}
