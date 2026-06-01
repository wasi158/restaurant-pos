import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Armchair, ShoppingBag, Truck, ExternalLink, Clock, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import tablesData from '../../mock/tables.json';

type Table = { id: string; label: string; seats: number };
const RESTAURANT_TABLES: Table[] = tablesData.items;
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import type { Order, ServiceChannel } from '../../lib/pos/types';

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

function normalizeTableId(tableStr: string): string {
  return tableStr.replace(/^table\s*/i, '').trim();
}

type Props = { onGoToPos: () => void };

export function TablesScreen({ onGoToPos }: Props) {
  const { formatMoney } = useAppSettings();
  const { state } = usePos();
  const [tab, setTab] = useState<ServiceTab>('dine_in');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableOverrides, setTableOverrides] = useState<Map<string, 'active' | 'free'>>(new Map());

  const toggleTableStatus = useCallback((tableId: string, currentlyActive: boolean) => {
    setTableOverrides(prev => {
      const next = new Map(prev);
      if (currentlyActive) {
        next.set(tableId, 'free');
      } else {
        next.set(tableId, 'active');
      }
      return next;
    });
  }, []);

  const t0 = startOfToday();

  const ordersToday = useMemo(
    () => state.orders.filter(o => new Date(o.createdAtIso).getTime() >= t0),
    [state.orders, t0],
  );

  const filtered = useMemo(
    () => ordersToday.filter(o => o.serviceChannel === tab).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
    [ordersToday, tab],
  );

  const shiftTotal = useMemo(() => ordersToday.reduce((s, o) => s + o.total, 0), [ordersToday]);

  const lastOrderByTable = useMemo(() => {
    const map = new Map<string, Order>();
    for (const o of filtered) {
      if (!o.table) continue;
      const id = normalizeTableId(o.table);
      if (!map.has(id)) map.set(id, o);
    }
    return map;
  }, [filtered]);

  const ordersByTable = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of filtered) {
      if (!o.table) continue;
      const id = normalizeTableId(o.table);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(o);
    }
    return map;
  }, [filtered]);

  const getTableActive = useCallback((tableId: string): boolean => {
    const hasOrders = lastOrderByTable.has(tableId);
    if (!hasOrders) return false;
    const override = tableOverrides.get(tableId);
    if (override === 'active') return true;
    if (override === 'free') return false;
    return true;
  }, [tableOverrides, lastOrderByTable]);

  const freeTables = useMemo(() => {
    const set = new Set<string>();
    for (const t of RESTAURANT_TABLES) {
      if (!getTableActive(t.id)) set.add(t.id);
    }
    return set;
  }, [getTableActive]);

  const displayOrders = useMemo(() => {
    if (tab !== 'dine_in' || !selectedTable) return filtered;
    return ordersByTable.get(selectedTable) ?? [];
  }, [tab, selectedTable, filtered, ordersByTable]);

  const isOrderDisabled = useCallback((order: Order): boolean => {
    if (tab !== 'dine_in' || !order.table) return false;
    const id = normalizeTableId(order.table);
    return freeTables.has(id);
  }, [tab, freeTables]);

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
    <div className="flex-1 flex flex-col gap-4 overflow-x-hidden p-4 sm:p-6 min-h-full">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-on-surface">Dining & service</h2>
          <p className="text-on-surface-variant text-sm mt-1">Track orders by table, takeaway and delivery</p>
        </div>
        <button type="button" onClick={onGoToPos}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary-container rounded-xl text-sm font-bold hover:brightness-105 shadow-md transition-all">
          <ExternalLink className="w-4 h-4" /> Open POS
        </button>
      </div>

      {/* Tabs + stats */}
      <div className="flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex gap-2">
          {tabBtn('dine_in', 'Dine-in', Armchair)}
          {tabBtn('takeaway', 'Takeaway', ShoppingBag)}
          {tabBtn('delivery', 'Delivery', Truck)}
        </div>
        <div className="flex items-center gap-4 text-xs text-on-surface-variant ml-auto">
          <span><span className="font-bold text-on-surface">{ordersToday.length}</span> orders today</span>
          <span>Shift: <span className="font-black text-primary text-sm">{formatMoney(shiftTotal)}</span></span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">

        {/* Left: Order list */}
        <div className={`flex flex-col border border-outline-variant rounded-2xl bg-surface-container-low overflow-hidden min-h-0 ${
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
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <AnimatePresence>
              {displayOrders.map(o => (
                <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <OrderRow order={o} formatMoney={formatMoney} disabled={isOrderDisabled(o)} />
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

        {/* Right: Table grid (dine-in only) */}
        {tab === 'dine_in' && (
          <div className="flex-1 overflow-y-auto flex items-start justify-center">
            <div className="flex flex-wrap justify-center gap-8 p-4">
              {RESTAURANT_TABLES.map(table => {
                const lastOrder = lastOrderByTable.get(table.id);
                const isActive = getTableActive(table.id);
                const hasOrders = !!lastOrder;
                const tableOrders = ordersByTable.get(table.id) ?? [];
                const isSelected = selectedTable === table.id;
                const orderTime = lastOrder
                  ? new Date(lastOrder.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
                      {/* Pulse rings for active tables */}
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

                      {/* Circle table */}
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

                        {isActive && hasOrders ? (
                          <>
                            <span className="text-[11px] font-black text-white/90 font-mono mt-0.5">
                              {formatMoney(lastOrder!.total)}
                            </span>
                            <span className="text-[9px] font-bold text-white/60 flex items-center gap-0.5 mt-0.5">
                              <Clock className="w-2.5 h-2.5" /> {orderTime}
                            </span>
                          </>
                        ) : isActive ? (
                          <>
                            <span className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {table.seats} seats
                            </span>
                            <span className="text-[9px] font-bold text-white/70 uppercase mt-0.5">Occupied</span>
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {table.seats} seats
                            </span>
                            <span className="text-[9px] font-bold text-secondary uppercase mt-0.5">Free</span>
                          </>
                        )}

                        {/* Order count badge */}
                        {isActive && hasOrders && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 bg-error text-white text-[8px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg"
                          >
                            {tableOrders.length}
                          </motion.div>
                        )}
                      </div>
                    </motion.button>

                    {/* Label below circle */}
                    <span className={`text-xs font-bold ${isActive ? 'text-[#ff9800]' : 'text-on-surface-variant'}`}>
                      {table.label}
                    </span>

                    {/* Toggle button — only for tables that have orders */}
                    {hasOrders ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTableStatus(table.id, isActive);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border transition-all ${
                          isActive
                            ? 'bg-[#ff9800]/15 border-[#ff9800]/40 text-[#ff9800] hover:bg-[#ff9800]/25'
                            : 'bg-secondary/10 border-secondary/30 text-secondary hover:bg-secondary/20'
                        }`}
                      >
                        {isActive
                          ? <><ToggleRight className="w-3.5 h-3.5" /> Active</>
                          : <><ToggleLeft className="w-3.5 h-3.5" /> Free</>
                        }
                      </button>
                    ) : (
                      <span className="text-[9px] text-on-surface-variant/50 uppercase tracking-wide">No orders</span>
                    )}

                    {/* Last order items preview */}
                    {isActive && hasOrders && lastOrder && (
                      <p className="text-[10px] text-on-surface-variant max-w-[140px] text-center line-clamp-1">
                        {lastOrder.items.map(it => `${it.qty}× ${it.nameSnapshot}`).join(', ')}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ order, formatMoney, disabled }: { order: Order; formatMoney: (n: number) => string; disabled?: boolean }) {
  const time = new Date(order.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const linePreview = order.items.map(it => `${it.qty}× ${it.nameSnapshot}`).join(' · ');

  return (
    <div className={`rounded-xl border p-3.5 text-left transition-all ${
      disabled
        ? 'border-outline-variant/50 bg-surface-container-high/40 opacity-40 pointer-events-none'
        : 'border-outline-variant bg-surface-container-high'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-on-surface truncate">{order.table}</p>
            {disabled && (
              <span className="text-[8px] font-bold uppercase bg-outline-variant/30 text-on-surface-variant px-1.5 py-0.5 rounded-full">Table Free</span>
            )}
          </div>
          <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">
            #{order.id.replace(/^ORD-/, '').slice(0, 8)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-base font-black ${disabled ? 'text-on-surface-variant' : 'text-primary'}`}>{formatMoney(order.total)}</p>
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
