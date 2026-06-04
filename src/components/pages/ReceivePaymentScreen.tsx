import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard, Banknote, Smartphone, Clock, CheckCircle2, AlertCircle,
  Receipt, Armchair, ShoppingBag, Truck, Printer,
} from 'lucide-react';
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import { isOrderPaid, isOrderPending, sumPaidOrderTotals } from '../../lib/pos/orderPayment';
import type { Order } from '../../lib/pos/types';
import { posOrderToBillOrder } from '../../lib/pos/posOrderToBillOrder';
import type { BillOrder } from './BillSlipScreen';
import { PageHeader } from '../organisms/PageHeader';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { StatCard } from '../molecules/StatCard';
import { CollapsibleStatsPanel } from '../molecules/CollapsibleStatsPanel';
import { SearchBar } from '../molecules/SearchBar';
import { PageScroll } from '../templates/PageScroll';

type FilterTab = 'pending' | 'paid' | 'all';

type Props = {
  highlightOrderId?: string | null;
  onPaymentComplete: (order: BillOrder, opts?: { autoPrint?: boolean }) => void;
};

function channelIcon(c: Order['serviceChannel']) {
  if (c === 'dine_in') return Armchair;
  if (c === 'takeaway') return ShoppingBag;
  return Truck;
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function ReceivePaymentScreen({ highlightOrderId, onPaymentComplete }: Props) {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(highlightOrderId ?? null);
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [cashReceived, setCashReceived] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const t0 = startOfToday();

  const ordersToday = useMemo(
    () =>
      [...state.orders]
        .filter((o) => new Date(o.createdAtIso).getTime() >= t0)
        .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
    [state.orders, t0],
  );

  const pendingOrders = useMemo(() => ordersToday.filter(isOrderPending), [ordersToday]);
  const paidOrders = useMemo(() => ordersToday.filter(isOrderPaid), [ordersToday]);
  const totalSalesToday = useMemo(() => sumPaidOrderTotals(ordersToday), [ordersToday]);

  const filtered = useMemo(() => {
    let list = ordersToday;
    if (filter === 'pending') list = pendingOrders;
    if (filter === 'paid') list = paidOrders;
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.table.toLowerCase().includes(q) ||
        o.items.some((it) => it.nameSnapshot.toLowerCase().includes(q)),
    );
  }, [ordersToday, pendingOrders, paidOrders, filter, search]);

  const selected = useMemo(
    () => (selectedId ? state.orders.find((o) => o.id === selectedId) ?? null : null),
    [selectedId, state.orders],
  );

  useEffect(() => {
    if (highlightOrderId) setSelectedId(highlightOrderId);
  }, [highlightOrderId]);

  useEffect(() => {
    if (!selected) return;
    if (isOrderPaid(selected)) {
      setPaymentMethod(selected.paymentMethod || 'Card');
      setCashReceived(
        selected.amountTendered != null ? String(selected.amountTendered) : String(selected.total),
      );
    } else {
      setPaymentMethod('Card');
      setCashReceived(selected.total > 0 ? String(Math.ceil(selected.total)) : '');
    }
    setError(null);
    setSuccess(false);
  }, [selected?.id, selected?.paymentStatus]);

  const changeDue = useMemo(() => {
    if (!selected || paymentMethod !== 'Cash') return 0;
    const received = parseFloat(cashReceived);
    if (!Number.isFinite(received)) return 0;
    return Math.max(0, received - selected.total);
  }, [selected, paymentMethod, cashReceived]);

  const handleReceivePayment = () => {
    if (!selected || !isOrderPending(selected)) return;
    setError(null);
    const result = actions.orders.receivePayment({
      orderId: selected.id,
      paymentMethod,
      amountTendered: paymentMethod === 'Cash' ? parseFloat(cashReceived) || 0 : undefined,
    });
    if (result.ok === false) {
      setError(result.reason);
      return;
    }
    setSuccess(true);
    const bill = posOrderToBillOrder(result.order);
    window.setTimeout(() => {
      onPaymentComplete(bill, { autoPrint: true });
      setSelectedId(null);
      setSuccess(false);
      setFilter('paid');
    }, 500);
  };

  const pendingTotal = useMemo(
    () => pendingOrders.reduce((s, o) => s + o.total, 0),
    [pendingOrders],
  );

  return (
    <PageScroll className="p-4 sm:p-6 space-y-5">
      <PageHeader
        title="Receive Payment"
        subtitle="Pay open bills, view payment history, and print receipts. Paid orders count in total sales; dine-in tables free when paid."
      />

      <CollapsibleStatsPanel title="Payment summary" storageKey="pos-stats-receive-payment">
        <StatCard label="Awaiting payment" value={pendingOrders.length} icon={<AlertCircle className="w-4 h-4" />} />
        <StatCard label="Due today" value={formatMoney(pendingTotal)} icon={<Receipt className="w-4 h-4" />} />
        <StatCard label="Total sales today" value={formatMoney(totalSalesToday)} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Paid today" value={paidOrders.length} icon={<Clock className="w-4 h-4" />} />
      </CollapsibleStatsPanel>

      <div className="flex flex-col lg:flex-row gap-5 lg:items-stretch">
        <div className="lg:w-[min(100%,420px)] shrink-0 flex flex-col rounded-2xl border border-outline-variant bg-surface-container-low">
          <div className="p-4 border-b border-outline-variant space-y-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search order, table, item…" className="w-full" />
            <div className="flex gap-1.5 flex-wrap">
              {(
                [
                  { key: 'pending' as const, label: `Unpaid (${pendingOrders.length})` },
                  { key: 'paid' as const, label: `Paid (${paidOrders.length})` },
                  { key: 'all' as const, label: `History (${ordersToday.length})` },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    filter === t.key
                      ? t.key === 'pending'
                        ? 'bg-tertiary text-white'
                        : t.key === 'paid'
                          ? 'bg-secondary text-white'
                          : 'bg-primary text-on-primary-container'
                      : 'bg-surface-container-high text-on-surface-variant border border-outline-variant'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {filtered.map((o) => {
                const Icon = channelIcon(o.serviceChannel);
                const pending = isOrderPending(o);
                const active = selectedId === o.id;
                return (
                  <motion.button
                    key={o.id}
                    type="button"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedId(o.id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                      active
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/25'
                        : 'border-outline-variant bg-surface-container-high hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{o.table}</p>
                          <p className="text-[10px] font-mono text-on-surface-variant">#{o.id}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-black text-primary tabular-nums">{formatMoney(o.total)}</p>
                        <Badge variant={pending ? 'warning' : 'success'} className="mt-1 text-[10px]">
                          {pending ? 'Unpaid' : o.paymentMethod || 'Paid'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-2 line-clamp-1">
                      {o.items.map((it) => `${it.qty}× ${it.nameSnapshot}`).join(' · ')}
                    </p>
                    <p className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(o.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {!pending && o.paidAtIso && (
                        <span className="ml-1">
                          · Paid {new Date(o.paidAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </p>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-12">No orders in this list.</p>
            )}
          </div>
        </div>

        <div className="flex-1 rounded-2xl border border-outline-variant bg-surface-container-low p-5 sm:p-6 min-h-[240px]">
          {!selected ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-on-surface-variant py-12">
              <Receipt className="w-12 h-12 opacity-40" />
              <p className="text-sm font-medium">Select an order to pay the bill or view receipt</p>
            </div>
          ) : isOrderPaid(selected) ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-secondary" />
                <h3 className="font-bold font-headline text-on-surface">Paid — in total sales</h3>
              </div>
              <p className="text-sm text-on-surface-variant">
                {selected.table} · {formatMoney(selected.total)} via{' '}
                <span className="font-semibold text-on-surface">{selected.paymentMethod}</span>
              </p>
              {selected.paidAtIso && (
                <p className="text-xs text-on-surface-variant">
                  Paid at {new Date(selected.paidAtIso).toLocaleString()}
                </p>
              )}
              {selected.serviceChannel === 'dine_in' && (
                <p className="text-xs text-secondary font-medium">Dine-in table is free on Dining & service.</p>
              )}
              <Button
                variant="secondary"
                icon={<Printer className="w-4 h-4" />}
                onClick={() => onPaymentComplete(posOrderToBillOrder(selected), { autoPrint: true })}
              >
                Print receipt
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="font-bold font-headline text-on-surface text-lg">{selected.table}</h3>
                <p className="text-xs font-mono text-on-surface-variant mt-0.5">#{selected.id}</p>
              </div>

              <div className="space-y-1 text-sm border border-outline-variant rounded-xl p-4 bg-surface-container-high">
                {selected.items.map((it, i) => (
                  <div key={i} className="flex justify-between gap-2 py-1">
                    <span className="text-on-surface">{it.qty}× {it.nameSnapshot}</span>
                    <span className="tabular-nums font-medium">{formatMoney(it.priceSnapshot * it.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-outline-variant pt-2 mt-2 space-y-1">
                  {(selected.discountTotal ?? 0) > 0.005 && (
                    <div className="flex justify-between text-secondary">
                      <span>Discount</span>
                      <span>−{formatMoney(selected.discountTotal)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Tax</span>
                    <span>{formatMoney(selected.tax)}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg text-on-surface pt-1">
                    <span>Amount due</span>
                    <span className="text-primary tabular-nums">{formatMoney(selected.total)}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">Payment method</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: CreditCard, label: 'Card' },
                    { icon: Banknote, label: 'Cash' },
                    { icon: Smartphone, label: 'Tap' },
                  ].map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => { setPaymentMethod(label); setError(null); }}
                      className={`flex flex-col items-center gap-2 py-4 border-2 rounded-xl text-xs font-bold uppercase transition-all ${
                        paymentMethod === label
                          ? 'bg-primary/15 text-primary border-primary/50'
                          : 'bg-surface-container-highest text-on-surface-variant border-outline-variant hover:text-on-surface'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'Cash' && (
                <div className="space-y-3 p-4 rounded-xl bg-surface-container-high border border-outline-variant">
                  <label className="text-xs font-bold text-on-surface block">Cash received</label>
                  <Input type="number" min="0" step="0.01" value={cashReceived} onChange={setCashReceived} fullWidth />
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface-variant">Change due</span>
                    <span className="font-black text-secondary tabular-nums">{formatMoney(changeDue)}</span>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-error font-semibold bg-error/10 border border-error/30 rounded-xl px-3 py-2">{error}</p>
              )}

              {success && (
                <p className="text-sm text-secondary font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Payment recorded — printing receipt…
                </p>
              )}

              <Button
                onClick={handleReceivePayment}
                icon={<Printer className="w-4 h-4" />}
                className="w-full justify-center py-3.5 text-base font-black uppercase tracking-wide"
              >
                Mark paid · {formatMoney(selected.total)} & print
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageScroll>
  );
}
