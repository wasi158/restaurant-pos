import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Armchair, ShoppingBag, Truck, ExternalLink, Clock, Users, Wallet } from 'lucide-react';
import tablesData from '../../mock/tables.json';

type Table = { id: string; label: string; seats: number };
const RESTAURANT_TABLES: Table[] = tablesData.items;
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import type { Order, ServiceChannel } from '../../lib/pos/types';
import { isOrderPaid, isOrderPending, normalizeTableId, tableIdFromOrder, sumPaidOrderTotals } from '../../lib/pos/orderPayment';
import { PageScroll } from '../templates/PageScroll';
import { CollapsibleStatsPanel } from '../molecules/CollapsibleStatsPanel';

type ServiceTab = 'dine_in' | 'takeaway' | 'delivery';

function channelLabel(c: ServiceChannel): string {
  if (c === 'dine_in') return 'Dine-in';
  if (c === 'takeaway') return 'Takeaway';
  return 'Delivery';
}

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

type Props = {
  onGoToPos: () => void;
  onGoToReceivePayment?: () => void;
};

export function TablesScreen({ onGoToPos, onGoToReceivePayment }: Props) {
  const { formatMoney } = useAppSettings();
  const { state } = usePos();
  const [tab, setTab] = useState<ServiceTab>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const t0 = startOfToday();

  const ordersToday = useMemo(
    () => state.orders.filter(o => new Date(o.createdAtIso).getTime() >= t0),
    [state.orders, t0],
  );

  const filtered = useMemo(
    () => ordersToday.filter(o => o.serviceChannel === tab).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
    [ordersToday, tab],
  );

  const totalSalesToday = useMemo(() => sumPaidOrderTotals(ordersToday), [ordersToday]);

  const unpaidDineInToday = useMemo(
    () => ordersToday.filter(o => o.serviceChannel === 'dine_in' && isOrderPending(o)),
    [ordersToday],
  );

  const ordersByTable = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of filtered) {
      if (o.serviceChannel !== 'dine_in' || !o.table) continue;
      const id = normalizeTableId(o.table);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(o);
    }
    return map;
  }, [filtered]);

  const lastUnpaidOrderByTable = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of unpaidDineInToday) {
      const id = tableIdFromOrder(o);
      if (!id) continue;
      const prev = map.get(id);
      if (!prev || o.createdAtIso > prev.createdAtIso) map.set(id, o);
    }
    return map;
  }, [unpaidDineInToday]);

  const unpaidCountByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of unpaidDineInToday) {
      const id = tableIdFromOrder(o);
      if (!id) continue;
      map.set(id, (map.get(id) ?? 0) + 1);
    }
    return map;
  }, [unpaidDineInToday]);

  const getTableActive = (tableId: string): boolean => (unpaidCountByTable.get(tableId) ?? 0) > 0;

  const displayOrders = useMemo(() => {
    if (tab !== 'dine_in' || !selectedTable) return filtered;
    return ordersByTable.get(selectedTable) ?? [];
  }, [tab, selectedTable, filtered, ordersByTable]);

  const tabBtn = (id: ServiceTab, label: string, Icon: React.ElementType) => (
    <button key={id} type="button"
      onClick={() => { setTab(id); setSelectedTable(null); }}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
        tab === id
          ? 'bg-primary text-on-primary-container border-primary shadow-md'
          : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:text-on-surface'
      }`}>
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <PageScroll className="flex flex-col gap-4 overflow-x-hidden p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-on-surface">Dining & service</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Tables free when dine-in bills are paid on Receive Payment
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onGoToReceivePayment && (
            <button type="button" onClick={onGoToReceivePayment}
              className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-white rounded-xl text-sm font-bold hover:brightness-105 shadow-md transition-all">
              <Wallet className="w-4 h-4" /> Receive payment
            </button>
          )}
          <button type="button" onClick={onGoToPos}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary-container rounded-xl text-sm font-bold hover:brightness-105 shadow-md transition-all">
            <ExternalLink className="w-4 h-4" /> Open POS
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex gap-2">
          {tabBtn('dine_in', 'Dine-in', Armchair)}
          {tabBtn('takeaway', 'Takeaway', ShoppingBag)}
          {tabBtn('delivery', 'Delivery', Truck)}
        </div>
        <CollapsibleStatsPanel
          title="Shift stats"
          storageKey="pos-stats-tables"
          layout="inline"
          className="ml-auto flex-1 min-w-[200px] max-w-full"
        >
          <span className="text-xs text-on-surface-variant px-2 py-1 rounded-lg bg-surface-container-high border border-outline-variant">
            <span className="font-bold text-on-surface">{ordersToday.length}</span> orders today
          </span>
          <span className="text-xs text-on-surface-variant px-2 py-1 rounded-lg bg-surface-container-high border border-outline-variant">
            Total sales: <span className="font-black text-primary">{formatMoney(totalSalesToday)}</span>
          </span>
          {tab === 'dine_in' && (
            <span className="text-xs text-on-surface-variant px-2 py-1 rounded-lg bg-surface-container-high border border-outline-variant">
              <span className="font-bold text-tertiary">{unpaidDineInToday.length}</span> awaiting payment
            </span>
          )}
        </CollapsibleStatsPanel>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className={`flex flex-col border border-outline-variant rounded-2xl bg-surface-container-low ${
          tab === 'dine_in' ? 'lg:w-[380px] w-full shrink-0' : 'flex-1 w-full'
        }`}>
          <div className="p-4 border-b border-outline-variant shrink-0">
            <h3 className="font-black font-headline text-on-surface text-sm uppercase tracking-wide">
              {tab === 'dine_in'
                ? selectedTable ? `Table ${selectedTable} Orders` : 'All Dine-in Orders'
                : tab === 'takeaway' ? 'Takeaway Orders' : 'Delivery Orders'}
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-1">
              {displayOrders.length} order{displayOrders.length !== 1 ? 's' : ''} today
              {tab === 'dine_in' && selectedTable && (
                <button type="button" onClick={() => setSelectedTable(null)}
                  className="ml-2 text-primary font-bold hover:underline">Show all</button>
              )}
            </p>
          </div>
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {displayOrders.map(o => (
                <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <OrderRow order={o} formatMoney={formatMoney} />
                </motion.div>
              ))}
            </AnimatePresence>
            {displayOrders.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-10 px-4">
                {tab === 'dine_in' && selectedTable
                  ? `No orders for Table ${selectedTable} today.`
                  : `No ${channelLabel(tab)} orders yet today.`}
              </p>
            )}
          </div>
        </div>

        {tab === 'dine_in' && (
          <div className="flex items-start justify-center py-4">
            <div className="flex flex-wrap justify-center gap-8 p-4">
              {RESTAURANT_TABLES.map(table => {
                const lastUnpaid = lastUnpaidOrderByTable.get(table.id);
                const isActive = getTableActive(table.id);
                const tableOrders = ordersByTable.get(table.id) ?? [];
                const isSelected = selectedTable === table.id;
                const unpaidCount = unpaidCountByTable.get(table.id) ?? 0;
                const orderTime = lastUnpaid
                  ? new Date(lastUnpaid.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : null;

                return (
                  <div key={table.id} className="relative flex flex-col items-center gap-2">
                    <motion.button
                      type="button"
                      onClick={() => setSelectedTable(isSelected ? null : table.id)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative flex flex-col items-center"
                    >
                      {isActive && (
                        <>
                          <motion.div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[140px] rounded-full bg-[#ff9800]/20"
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                          />
                          <motion.div
                            className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[140px] rounded-full bg-[#ff9800]/15"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                          />
                        </>
                      )}

                      <div className={`relative w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center border-[3px] shadow-xl transition-all ${
                        isActive
                          ? isSelected
                            ? 'bg-[#ff9800] border-[#ff9800] ring-4 ring-[#ff9800]/40'
                            : 'bg-[#ff9800] border-[#ff9800]/80'
                          : isSelected
                            ? 'bg-surface-container-high border-primary ring-4 ring-primary/30'
                            : 'bg-surface-container-high border-outline-variant hover:border-on-surface-variant'
                      }`}>
                        <span className={`text-3xl font-black font-headline ${isActive ? 'text-white' : 'text-on-surface'}`}>
                          {table.id}
                        </span>

                        {isActive && lastUnpaid ? (
                          <>
                            <span className="text-[11px] font-black text-white/90 font-mono mt-0.5">
                              {formatMoney(lastUnpaid.total)}
                            </span>
                            <span className="text-[9px] font-bold text-white/60 flex items-center gap-0.5 mt-0.5">
                              <Clock className="w-2.5 h-2.5" /> {orderTime}
                            </span>
                            <span className="text-[8px] font-bold text-white/80 uppercase mt-0.5">Unpaid</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {table.seats} seats
                            </span>
                            <span className="text-[9px] font-bold text-secondary uppercase mt-0.5">Free</span>
                          </>
                        )}

                        {isActive && unpaidCount > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-error text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                          >
                            {unpaidCount}
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    <span className={`text-xs font-bold ${isActive ? 'text-[#ff9800]' : 'text-on-surface-variant'}`}>
                      {table.label}
                    </span>

                    {isActive && lastUnpaid && (
                      <p className="text-[10px] text-on-surface-variant max-w-[140px] text-center line-clamp-1">
                        {lastUnpaid.items.map(it => `${it.qty}× ${it.nameSnapshot}`).join(', ')}
                      </p>
                    )}

                    {!isActive && tableOrders.length > 0 && (
                      <p className="text-[9px] text-secondary font-semibold uppercase tracking-wide">Paid · ready</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </PageScroll>
  );
}

function OrderRow({ order, formatMoney }: { order: Order; formatMoney: (n: number) => string }) {
  const time = new Date(order.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const linePreview = order.items.map(it => `${it.qty}× ${it.nameSnapshot}`).join(' · ');
  const pending = isOrderPending(order);
  const paid = isOrderPaid(order);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-3.5 text-left transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-on-surface truncate">{order.table}</p>
            <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
              pending
                ? 'bg-tertiary/20 text-tertiary'
                : paid
                  ? 'bg-secondary/20 text-secondary'
                  : 'bg-outline-variant/30 text-on-surface-variant'
            }`}>
              {pending ? 'Unpaid' : paid && order.paymentMethod ? order.paymentMethod : 'Paid'}
            </span>
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">
            #{order.id.replace(/^ORD-/, '').slice(0, 8)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-base font-black ${pending ? 'text-primary' : 'text-on-surface'}`}>{formatMoney(order.total)}</p>
          <p className="text-[10px] text-on-surface-variant flex items-center justify-end gap-1 mt-0.5">
            <Clock className="w-3 h-3" /> {time}
          </p>
        </div>
      </div>
      <p className="text-[11px] text-on-surface-variant mt-2 line-clamp-2">{linePreview}</p>
      {order.serviceChannel === 'delivery' && order.deliveryAddress && (
        <p className="text-[10px] text-on-surface-variant mt-1.5 pt-1.5 border-t border-outline-variant line-clamp-2">
          {order.deliveryAddress}
        </p>
      )}
      {order.serviceChannel === 'takeaway' && order.customerPhone && (
        <p className="text-[10px] font-mono text-on-surface-variant mt-1">{order.customerPhone}</p>
      )}
    </div>
  );
}
