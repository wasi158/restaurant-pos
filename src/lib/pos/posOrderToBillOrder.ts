import type { BillOrder } from '../../components/BillSlipScreen';
import type { Order as PosOrder } from './types';

/** Newest POS order by timestamp (not array index — persisted data may be any order). */
export function getLatestPosOrder(orders: PosOrder[]): PosOrder | null {
  if (!orders.length) return null;
  return [...orders].sort((a, b) => {
    const ta = Date.parse(a.createdAtIso) || 0;
    const tb = Date.parse(b.createdAtIso) || 0;
    if (tb !== ta) return tb - ta;
    return b.id.localeCompare(a.id);
  })[0];
}

export function posOrderToBillOrder(o: PosOrder): BillOrder {
  return {
    id: o.id,
    table: o.table,
    items: o.items.map((it, idx) => ({
      id: idx,
      name: it.nameSnapshot,
      price: it.priceSnapshot,
      qty: it.qty,
    })),
    grossSubtotal: o.grossSubtotal,
    discountTotal: o.discountTotal,
    subtotal: o.subtotal,
    tax: o.tax,
    total: o.total,
    promotionSummary: o.promotionName,
    paymentMethod: o.paymentMethod,
    time: new Date(o.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    serviceChannel: o.serviceChannel,
    customerName: o.customerName ?? undefined,
    customerPhone: o.customerPhone ?? undefined,
    deliveryAddress: o.deliveryAddress ?? undefined,
    deliveryNotes: o.deliveryNotes ?? undefined,
  };
}
