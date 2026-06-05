import React from 'react';
import { motion } from 'motion/react';
import { Printer, ArrowLeft, CheckCircle2, ShoppingBag, MapPin, Phone, Globe, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useAppSettings } from '../../lib/appSettings';
import { printReceipt } from '../../lib/printReceipt';
import type { ServiceChannel } from '../../lib/pos/types';
import { PageScroll } from '../templates/PageScroll';

type BillItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
};

export type BillKind = 'customer_due' | 'paid';

export type BillOrder = {
  id: string;
  table: string;
  /** Customer check before payment vs paid receipt after Receive Payment. */
  billKind?: BillKind;
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
  onReceivePayment?: () => void;
};

export function BillSlipScreen({ order, onNewOrder, onReceivePayment }: Props) {
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
  const isCustomerDue = order?.billKind === 'customer_due';

  if (!order) {
    return (
      <PageScroll>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-on-surface-variant px-6">
          <p>No active bill to display.</p>
          <button onClick={onNewOrder} className="px-6 py-2 bg-primary text-on-primary rounded-xl font-bold">
            Go to POS
          </button>
        </div>
      </PageScroll>
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
    <PageScroll className="bg-surface bill-slip-screen">
      <div className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant no-print sticky top-0 z-10 bg-surface/95 backdrop-blur-sm">
        <button onClick={onNewOrder} className="flex items-center gap-2 text-sm font-semibold text-on-surface hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to POS
        </button>
        {isCustomerDue ? (
          <div className="flex items-center gap-2 text-tertiary font-bold text-sm text-center">
            <ShoppingBag className="w-5 h-5 shrink-0" />
            Customer bill — amount to pay
          </div>
        ) : (
          <div className="flex items-center gap-2 text-secondary font-bold text-sm text-center">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            Order paid successfully
          </div>
        )}
        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-surface-container-high border border-outline-variant rounded-xl text-sm font-bold hover:bg-surface-bright transition-all shrink-0">
          <Printer className="w-4 h-4" /> {isCustomerDue ? 'Print bill' : 'Print receipt'}
        </button>
      </div>

      <div className="p-6 sm:p-8 flex justify-center bg-surface-container-lowest print:p-0 print:bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white text-slate-900 rounded-sm shadow-2xl p-8 sm:p-10 font-mono print:shadow-none print:p-0 receipt-container"
        >
          <div className="text-center space-y-2 border-b-2 border-dashed border-slate-200 pb-6 mb-6">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">Restaurant POS</h1>
            {isCustomerDue && (
              <p className="text-sm font-black uppercase tracking-widest text-amber-800 border border-amber-300 bg-amber-50 px-3 py-1 rounded mt-2">
                Customer bill — amount to pay
              </p>
            )}
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Restaurant Point of Sale</p>
            <div className="flex flex-col gap-1 mt-4 text-[10px] text-slate-400 font-bold uppercase">
              <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> 124 Science Park, London</span>
              <span className="flex items-center justify-center gap-1"><Phone className="w-3 h-3" /> +44 20 7946 0124</span>
              <span className="flex items-center justify-center gap-1"><Globe className="w-3 h-3" /> restaurant-pos.com</span>
            </div>
          </div>

          <div className="flex justify-between text-xs font-bold uppercase mb-4 gap-2">
            <div className="space-y-1 min-w-0">
              <p className="text-slate-400">Order ID</p>
              <p className="break-all">{order.id}</p>
            </div>
            <div className="text-center space-y-1 px-1 shrink-0">
              <p className="text-slate-400">{midColumnLabel}</p>
              <p className="normal-case font-semibold text-[11px] leading-snug">{order.table}</p>
            </div>
            <div className="text-right space-y-1 shrink-0">
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
              <span className="text-slate-400 uppercase font-bold">Tax ({taxPctLabel}%)</span>
              <span className="font-bold">{formatMoney(order.tax)}</span>
            </div>
            <div className={`flex justify-between text-lg pt-4 gap-2 ${isCustomerDue ? 'border-t-2 border-dashed border-slate-300 mt-2' : ''}`}>
              <span className={`uppercase tracking-tighter font-black ${isCustomerDue ? 'text-slate-800' : 'text-slate-900'}`}>
                {isCustomerDue ? 'Amount to pay' : 'Total amount'}
              </span>
              <span className={`font-black tabular-nums shrink-0 ${isCustomerDue ? 'text-xl text-amber-700 underline decoration-2 decoration-amber-500' : 'text-slate-900 underline decoration-2 decoration-primary decoration-offset-4'}`}>
                {formatMoney(order.total)}
              </span>
            </div>
          </div>

          {isCustomerDue && (
            <div className="mt-6 p-4 border-2 border-dashed border-amber-400/60 bg-amber-50 rounded text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Payment not yet received</p>
              <p className="text-xs text-amber-900/80 mt-1 font-semibold">Please pay this amount at the counter when ready.</p>
            </div>
          )}

          <div className={`mt-8 flex flex-wrap items-center justify-between gap-2 p-3 rounded italic text-xs ${isCustomerDue ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50'}`}>
            {isCustomerDue ? (
              <>
                <span className="uppercase font-bold text-amber-900">Payment: due at checkout</span>
                <span className="font-black text-amber-800">STATUS: UNPAID</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2 uppercase font-bold text-slate-800">
                  Payment: <span className="flex items-center gap-1"><PaymentIcon /> {order.paymentMethod}</span>
                </span>
                <span className="font-bold text-secondary">STATUS: PAID</span>
              </>
            )}
          </div>

          <div className="mt-12 text-center">
            <div className="flex justify-center gap-1 mb-4 opacity-20 grayscale">
              {[...Array(24)].map((_, i) => (
                <div key={i} className={`w-1 h-8 ${i % 3 === 0 ? 'bg-black' : 'bg-black/40'}`} />
              ))}
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              {isCustomerDue ? 'This is not a tax invoice until paid' : 'Thank you for dining with us'}
            </p>
            <p className="text-[8px] mt-2 text-slate-300 uppercase">Prices inclusive of VAT • No service charge</p>
          </div>
        </motion.div>
      </div>

      <div className="px-4 sm:px-6 py-6 sm:py-8 bg-surface border-t border-outline-variant flex flex-wrap justify-center gap-3 no-print">
        {isCustomerDue && onReceivePayment && (
          <button
            type="button"
            onClick={onReceivePayment}
            className="px-8 py-3 bg-secondary text-white font-black uppercase tracking-widest rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
          >
            Receive payment
          </button>
        )}
        <button
          type="button"
          onClick={onNewOrder}
          className="px-10 py-3 bg-primary text-on-primary-container font-black uppercase tracking-widest rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all text-sm"
        >
          {isCustomerDue ? 'Back to POS' : 'Start new order'}
        </button>
      </div>
    </PageScroll>
  );
}
