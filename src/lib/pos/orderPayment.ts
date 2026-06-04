import type { Order, PaymentStatus } from './types';

/** Legacy orders without paymentStatus are treated as paid. */
export function getPaymentStatus(order: Order): PaymentStatus {
  if (order.paymentStatus === 'pending' || order.paymentStatus === 'paid') {
    return order.paymentStatus;
  }
  return 'paid';
}

export function isOrderPaid(order: Order): boolean {
  return getPaymentStatus(order) === 'paid';
}

export function isOrderPending(order: Order): boolean {
  return getPaymentStatus(order) === 'pending';
}

export function normalizeTableId(tableStr: string): string {
  return tableStr.replace(/^table\s*/i, '').trim();
}

export function tableIdFromOrder(order: Order): string | null {
  if (order.serviceChannel !== 'dine_in' || !order.table) return null;
  return normalizeTableId(order.table);
}

/** Sum totals for paid orders in a date range (total sales). */
export function sumPaidOrderTotals(orders: Order[]): number {
  return orders.filter(isOrderPaid).reduce((s, o) => s + o.total, 0);
}
