import React from 'react';
import { motion } from 'motion/react';
import { Printer, ArrowLeft, CheckCircle2, ShoppingBag, MapPin, Phone, Globe, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useAppSettings } from '../../lib/appSettings';
import { printReceipt } from '../../lib/printReceipt';
import type { ServiceChannel } from '../../lib/pos/types';

type BillItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

export type BillOrder = {
  id: string;
  table: string;
  items: BillItem[];
  /** List subtotal before promotion (optional for legacy mock receipts). */
  grossSubtotal?: number;
  discountTotal?: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
  time: string;
  promotionSummary?: string | null;
  serviceChannel?: ServiceChannel;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
};

type Props = {
  order: BillOrder | null;
  onNewOrder: () => void;
};

export function BillSlipScreen({ order, onNewOrder }: Props) {
  const { formatMoney } = useAppSettings();

  const taxPctLabel =
    order && order.subtotal > 0
      ? Math.round((order.tax / order.subtotal) * 1000) / 10
      : 10;
  const showDiscount = order != null && (order.discountTotal ?? 0) > 0.005;
  const serviceLabel =
    order?.serviceChannel === 'takeaway'
      ? 'Takeaway'
      : order?.serviceChannel === 'delivery'
        ? 'Delivery'
        : 'Dine-in';
  const midColumnLabel = !order?.serviceChannel || order.serviceChannel === 'dine_in' ? 'Table' : 'Service';

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-on-surface-variant">
        <p>No active bill to display.</p>
        <button onClick={onNewOrder} className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold">
          Go to POS
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    void printReceipt();
  };

  const PaymentIcon = () => {
    switch (order.paymentMethod) {
      case 'Card': return <CreditCard className="w-4 h-4" />;
      case 'Cash': return <Banknote className="w-4 h-4" />;
      case 'Tap': return <Smartphone className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col min-h-full overflow-x-hidden bg-surface bill-slip-screen">
      <div className="p-6 flex items-center justify-between border-b border-outline-variant no-print">
        <button onClick={onNewOrder} className="flex items-center gap-2 text-sm font-semibold text-on-surface hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to POS
        </button>
        <div className="flex items-center gap-2 text-secondary font-bold">
          <CheckCircle2 className="w-6 h-6" />
          Order Paid Successfully
        </div>
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-sm font-bold hover:bg-surface-bright transition-all">
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-surface-container-lowest print:p-0 print:bg-white">
        {/* Receipt Mock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white text-slate-900 rounded-sm shadow-2xl p-10 font-mono print:shadow-none print:p-0 receipt-container"
        >
          {/* Header */}
          <div className="text-center space-y-2 border-b-2 border-dashed border-slate-200 pb-6 mb-6">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Restaurant POS</h1>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Restaurant Point of Sale</p>
            <div className="flex flex-col gap-1 mt-4 text-[10px] text-slate-400 font-bold uppercase">
              <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> 124 Science Park, London</span>
              <span className="flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> +44 20 7946 0124</span>
              <span className="flex items-center justify-center gap-1"><Globe className="w-3 h-3" /> restaurant-pos.com</span>
            </div>
          </div>

          {/* Order Info */}
          <div className="flex justify-between text-xs font-bold uppercase mb-4">
            <div className="space-y-1">
              <p className="text-slate-400">Order ID</p>
              <p>{order.id}</p>
            </div>
            <div className="text-center space-y-1 px-1">
              <p className="text-slate-400">{midColumnLabel}</p>
              <p className="normal-case font-semibold text-[11px] leading-snug">{order.table}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-slate-400">Date/Time</p>
              <p>{order.time}</p>
            </div>
          </div>
          <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-6 pb-4 border-b border-dashed border-slate-200">
            {serviceLabel}
            {order.serviceChannel === 'delivery' && order.customerPhone && (
              <span className="block normal-case font-mono text-slate-600 mt-1">{order.customerPhone}</span>
            )}
          </div>
          {order.serviceChannel === 'delivery' && order.deliveryAddress && (
            <div className="text-[10px] font-bold uppercase text-slate-500 mb-6 space-y-1">
              <p className="text-slate-400">Deliver to</p>
              {order.customerName && (
                <p className="normal-case text-slate-800 font-black text-[11px] mb-1">{order.customerName}</p>
              )}
              <p className="normal-case text-slate-700 font-semibold leading-relaxed whitespace-pre-wrap">{order.deliveryAddress}</p>
              {order.deliveryNotes && (
                <p className="normal-case text-slate-600 mt-2 pt-2 border-t border-slate-100">
                  <span className="text-slate-400">Notes · </span>
                  {order.deliveryNotes}
                </p>
              )}
            </div>
          )}
          {order.serviceChannel === 'takeaway' && order.customerPhone && (
            <div className="text-[10px] text-slate-600 mb-6 text-center font-mono">
              Pickup phone: {order.customerPhone}
            </div>
          )}

          {/* Items Table */}
          <table className="w-full mb-8">
            <thead>
              <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 italic">
                <th className="text-left pb-2">Item Description</th>
                <th className="text-center pb-2">Qty</th>
                <th className="text-right pb-2">Amount</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-slate-50">
                  <td className="py-3 pr-4 font-bold uppercase">{item.name}</td>
                  <td className="py-3 text-center">{item.qty}</td>
                  <td className="py-3 text-right font-bold">{formatMoney(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-2 border-t-2 border-dashed border-slate-200 pt-6">
            {showDiscount && order.grossSubtotal != null && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 uppercase font-bold">List subtotal</span>
                <span className="font-bold">{formatMoney(order.grossSubtotal)}</span>
              </div>
            )}
            {showDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 uppercase font-bold">
                  Discount{order.promotionSummary ? ` (${order.promotionSummary})` : ''}
                </span>
                <span className="font-bold text-secondary">−{formatMoney(order.discountTotal ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400 uppercase font-bold">Subtotal</span>
              <span className="font-bold">{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white uppercase font-bold">Tax ({taxPctLabel}%)</span>
              <span className="font-bold text-white">{formatMoney(order.tax)}</span>
            </div>
            <div className="flex justify-between text-lg pt-4">
              <span className="text-white uppercase tracking-tighter">Total Amount</span>
              <span className="text-white underline decoration-2 decoration-primary decoration-offset-4">{formatMoney(order.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-8 flex items-center justify-between p-3 bg-slate-50 rounded italic text-xs">
            <span className="flex items-center gap-2 uppercase font-bold">
              Payment: <span className="flex items-center gap-1"><PaymentIcon /> {order.paymentMethod}</span>
            </span>
            <span className="font-bold">STATUS: PAID</span>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="flex justify-center gap-1 mb-4 opacity-20 grayscale">
              {[...Array(24)].map((_, i) => (
                <div key={i} className={`w-1 h-8 ${i % 3 === 0 ? 'bg-black' : 'bg-black/40'}`} />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Thank you for dining with us</p>
            <p className="text-[8px] mt-2 text-slate-300 uppercase">Prices inclusive of VAT • No service charge</p>
          </div>
        </motion.div>
      </div>

      <div className="p-6 bg-surface border-t border-outline-variant flex justify-center no-print">
        <button onClick={onNewOrder} className="px-10 py-3 bg-primary text-on-primary-container font-black uppercase tracking-widest rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all text-sm">
          Start New Order
        </button>
      </div>
    </div>
  );
}
