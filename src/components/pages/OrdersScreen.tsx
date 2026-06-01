import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, ChefHat, Clock, MoreHorizontal, Printer, Truck, XCircle } from 'lucide-react';
import { BillOrder } from './BillSlipScreen';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { Pagination } from '../molecules/Pagination';
import { PageHeader } from '../organisms/PageHeader';
import { useAppSettings } from '../../lib/appSettings';
import { usePos } from '../../lib/pos/store';
import type { Order as PosOrder } from '../../lib/pos/types';
import { getLatestPosOrder, posOrderToBillOrder } from '../../lib/pos/posOrderToBillOrder';

const ORDER_STATUSES = ['All', 'Pending', 'Preparing', 'Ready', 'Served', 'Cancelled'] as const;

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const statusConfig: Record<string, { icon: React.ElementType; badge: BadgeVariant }> = {
  Pending:   { icon: Clock,        badge: 'warning' },
  Preparing: { icon: ChefHat,      badge: 'info' },
  Ready:     { icon: CheckCircle2,  badge: 'success' },
  Served:    { icon: Truck,         badge: 'neutral' },
  Cancelled: { icon: XCircle,       badge: 'error' },
};

type Props = {
  onPrintReceipt: (order: BillOrder) => void;
};

/** POS charges are paid immediately — show as completed for the floor list. */
function posOrderUiStatus(_o: PosOrder): string {
  return 'Served';
}

function formatListTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

export function OrdersScreen({ onPrintReceipt }: Props) {
  const { formatMoney } = useAppSettings();
  const { state } = usePos();
  const orders = state.orders;

  const [filter, setFilter] = useState<string>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (orders.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !orders.some(o => o.id === selectedId)) {
      const latest = getLatestPosOrder(orders);
      setSelectedId(latest?.id ?? null);
    }
  }, [orders, selectedId]);

  const selected = useMemo(
    () => (selectedId ? orders.find(o => o.id === selectedId) ?? null : null),
    [orders, selectedId]
  );

  const filtered = useMemo(() => {
    const sorted = [...orders].sort((a, b) => {
      const ta = Date.parse(a.createdAtIso) || 0;
      const tb = Date.parse(b.createdAtIso) || 0;
      return tb - ta;
    });
    const rows = sorted.map(o => ({ order: o, status: posOrderUiStatus(o) }));
    if (filter === 'All') return rows;
    return rows.filter(r => r.status === filter);
  }, [orders, filter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="flex flex-col lg:flex-row min-h-full overflow-x-hidden">
      <div className={`flex-1 flex-col overflow-hidden lg:border-r border-outline-variant ${selectedId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 pb-4 border-b border-outline-variant">
          <PageHeader
            title="Live Orders"
            subtitle={`${orders.length} order${orders.length !== 1 ? 's' : ''} from Point of Sale (newest first)`}
          />
          <CategoryFilter
            categories={[...ORDER_STATUSES]}
            active={filter}
            onChange={setFilter}
            className="mt-4 flex-wrap"
          />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {paginatedData.map((row, i) => {
              const { order, status } = row;
              const cfg = statusConfig[status] ?? statusConfig.Served;
              const Icon = cfg.icon;
              return (
                <motion.button
                  key={order.id}
                  type="button"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedId(order.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedId === order.id
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-surface-container-high border-outline-variant hover:bg-surface-bright'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-on-surface text-sm">{order.table}</span>
                        <span className="text-[10px] text-on-surface-variant font-mono">{order.id}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {order.paymentMethod} · {formatListTime(order.createdAtIso)}
                      </p>
                    </div>
                    <Badge
                      variant={cfg.badge}
                      icon={<Icon className="w-3 h-3" />}
                      className="text-[10px] font-black uppercase px-2 py-0.5"
                    >
                      {status}
                    </Badge>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2 truncate">
                    {order.items.map(item => `${item.qty}× ${item.nameSnapshot}`).join(' · ')}
                  </p>
                  <p className="text-sm font-black text-primary mt-1">{formatMoney(order.total)}</p>
                </motion.button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-10">
                {orders.length === 0
                  ? 'No orders yet — charge a sale in Point of Sale to see it here.'
                  : 'No orders match your filter.'}
              </p>
            )}
          </div>
          {filtered.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      <div className={`w-full lg:w-80 bg-surface-container-low flex-col shrink-0 ${selectedId ? 'flex' : 'hidden lg:flex'}`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-on-surface-variant text-sm">
            Select an order to view details and print the receipt.
          </div>
        ) : (
          <>
            <div className="p-5 border-b border-outline-variant flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden -ml-1.5 w-7 h-7"
                  aria-label="Back to orders"
                  icon={<ArrowLeft className="w-4 h-4" />}
                />
                <div>
                  <h2 className="font-black font-headline text-on-surface text-lg">{selected.table}</h2>
                  <p className="text-xs text-on-surface-variant font-mono">{selected.id}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                aria-label="More"
                icon={<MoreHorizontal className="w-4 h-4" />}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Order Items</p>
                {selected.items.map((item, idx) => (
                  <div key={`${item.menuItemId}-${idx}`} className="flex justify-between text-sm gap-2">
                    <span className="text-on-surface">{item.qty}× {item.nameSnapshot}</span>
                    <span className="text-on-surface-variant font-mono tabular-nums shrink-0">{formatMoney(item.priceSnapshot * item.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-surface-container-high rounded-xl p-4 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Details</p>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Placed</span>
                  <span className="text-on-surface font-medium">{formatListTime(selected.createdAtIso)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Payment</span>
                  <span className="text-on-surface font-medium">{selected.paymentMethod}</span>
                </div>
                {(selected.discountTotal ?? 0) > 0.005 && (
                  <div className="flex justify-between text-sm text-secondary font-semibold">
                    <span>Discount</span>
                    <span className="tabular-nums">−{formatMoney(selected.discountTotal ?? 0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Subtotal</span>
                  <span className="text-on-surface font-medium tabular-nums">{formatMoney(selected.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Tax</span>
                  <span className="text-on-surface font-medium tabular-nums">{formatMoney(selected.tax)}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-outline-variant">
                  <span className="text-on-surface-variant">Total</span>
                  <span className="text-primary font-black tabular-nums">{formatMoney(selected.total)}</span>
                </div>
              </div>

              <Badge
                variant={statusConfig[posOrderUiStatus(selected)].badge}
                icon={React.createElement(statusConfig[posOrderUiStatus(selected)].icon, { className: 'w-4 h-4' })}
                className="w-full rounded-xl p-3 uppercase tracking-wider font-black"
              >
                {posOrderUiStatus(selected)}
              </Badge>
            </div>

            <div className="p-4 border-t border-outline-variant">
              <Button
                variant="primary"
                onClick={() => onPrintReceipt(posOrderToBillOrder(selected))}
                icon={<Printer className="w-4 h-4" />}
                className="w-full justify-center"
              >
                Print receipt
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
