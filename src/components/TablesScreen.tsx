import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Edit3, Armchair, ShoppingBag, Truck, ExternalLink, Clock } from 'lucide-react';
import { INITIAL_TABLES, TABLE_STATUS_COLORS } from '../data/mockTables';
import { usePos } from '../lib/pos/store';
import { useAppSettings } from '../lib/appSettings';
import type { Order, ServiceChannel } from '../lib/pos/types';

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
};

export function TablesScreen({ onGoToPos }: Props) {
  const { formatMoney } = useAppSettings();
  const { state } = usePos();
  const [tab, setTab] = useState<ServiceTab>('dine_in');

  const t0 = startOfToday();

  const ordersToday = useMemo(
    () =>
      state.orders.filter(o => {
        const t = new Date(o.createdAtIso).getTime();
        return t >= t0;
      }),
    [state.orders, t0]
  );

  const filtered = useMemo(
    () => ordersToday.filter(o => o.serviceChannel === tab).sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
    [ordersToday, tab]
  );

  const shiftTotal = useMemo(
    () => ordersToday.reduce((s, o) => s + o.total, 0),
    [ordersToday]
  );

  const recentTableIds = useMemo(() => {
    const set = new Set<string>();
    filtered.forEach(o => {
      if (o.table) {
        // Try to normalize the table ID (e.g., "Table 201" -> "201")
        const id = o.table.replace(/Table\s+/i, '').trim();
        set.add(id);
        set.add(o.table.trim());
      }
    });
    return set;
  }, [filtered]);

  const activeDineApprox = INITIAL_TABLES.filter(t => t.status === 'occupied' || t.status === 'ready').length;

  const tabBtn = (id: ServiceTab, label: string, Icon: React.ElementType) => (
    <button
      key={id}
      type="button"
      onClick={() => setTab(id)}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all ${
        tab === id
          ? 'bg-primary text-on-primary-container border-primary shadow-md'
          : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:text-on-surface'
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full p-6 min-h-0">
      <div className="flex flex-wrap items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-black font-headline tracking-tighter text-on-surface">Dining & service</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            Floor plan for dine-in · Live lists from POS for takeaway and delivery
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToPos}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary-container rounded-xl text-sm font-bold hover:brightness-105 shadow-md transition-all"
        >
          <ExternalLink className="w-4 h-4" />
          Open POS
        </button>
      </div>

      <div className="flex flex-wrap gap-2 shrink-0">
        {tabBtn('dine_in', 'Dine-in', Armchair)}
        {tabBtn('takeaway', 'Takeaway', ShoppingBag)}
        {tabBtn('delivery', 'Delivery', Truck)}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant shrink-0">
        <span>
          <span className="font-bold text-on-surface">{ordersToday.length}</span> checks today (all channels)
        </span>
        <span className="hidden sm:inline">·</span>
        <span>
          Shift total: <span className="font-black text-primary text-base ml-1">{formatMoney(shiftTotal)}</span>
        </span>
        {tab === 'dine_in' && (
          <>
            <span className="hidden sm:inline">·</span>
            <span>Floor sample: ~{activeDineApprox} busy tables (mock layout)</span>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        <div
          className={`flex flex-col border border-outline-variant rounded-2xl bg-surface-container-low overflow-hidden min-h-0 ${
            tab === 'dine_in' ? 'lg:w-[380px] w-full shrink-0' : 'flex-1 w-full'
          }`}
        >
          <div className="p-4 border-b border-outline-variant shrink-0">
            <h3 className="font-black font-headline text-on-surface text-sm uppercase tracking-wide">
              {tab === 'dine_in' && 'Recent dine-in (POS)'}
              {tab === 'takeaway' && 'Takeaway orders (today)'}
              {tab === 'delivery' && 'Delivery orders (today)'}
            </h3>
            <p className="text-[10px] text-on-surface-variant mt-1">
              {filtered.length} order{filtered.length !== 1 ? 's' : ''} · settled in POS appear here
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map(o => (
              <OrderRow key={o.id} order={o} formatMoney={formatMoney} />
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-10 px-4">
                No {channelLabel(tab)} orders yet today. Ring one up in POS with the correct service mode.
              </p>
            )}
          </div>
        </div>

        {tab === 'dine_in' && (
          <div className="flex-1 bg-surface-container-lowest rounded-2xl relative border border-outline-variant overflow-hidden flex flex-col min-h-[280px] lg:min-h-0">
            <div className="absolute inset-0 flex pointer-events-none">
              <div className="flex-1 border-r border-outline-variant/30 flex items-end p-6">
                <span className="text-[clamp(2rem,8vw,4rem)] font-black text-on-surface/[0.06] select-none uppercase tracking-tighter font-headline">
                  Patio
                </span>
              </div>
              <div className="flex-1 flex items-end p-6">
                <span className="text-[clamp(2rem,8vw,4rem)] font-black text-on-surface/[0.06] select-none uppercase tracking-tighter font-headline">
                  Lounge
                </span>
              </div>
            </div>
            <div className="relative flex-1 w-full min-h-[260px] max-h-[480px] lg:max-h-none mx-auto max-w-5xl">
              {INITIAL_TABLES.map(table => {
                const isActive = recentTableIds.has(table.id);
                return (
                  <motion.div
                    key={table.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: isActive ? [1, 1.05, 1] : 1 
                    }}
                    transition={{
                      scale: isActive 
                        ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.2 }
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    style={{ top: table.top, left: table.left }}
                    className="absolute cursor-pointer group"
                  >
                    <div
                      className={`${table.size} ${
                        table.type === 'round' ? 'rounded-full' : table.type === 'bar' ? 'rounded-full' : 'rounded-xl'
                      } ${isActive ? 'bg-[#ff9800] ring-4 ring-[#ff9800]/30' : 'bg-surface-container-high'} flex flex-col items-center justify-center border-l-4 ${
                        TABLE_STATUS_COLORS[table.status]
                      } shadow-lg hover:bg-surface-bright transition-all relative`}
                    >
                      <span className={`text-lg font-black font-headline ${isActive ? 'text-white' : 'text-on-surface'}`}>{table.id}</span>
                      <span
                        className={`text-[8px] font-black uppercase mt-1 ${
                          isActive 
                            ? 'text-white/90'
                            : table.status === 'ready'
                              ? 'text-secondary'
                              : table.status === 'occupied'
                                ? 'text-error'
                                : table.status === 'reserved'
                                  ? 'text-tertiary'
                                  : 'text-on-surface-variant'
                        }`}
                      >
                        {isActive ? 'ACTIVE ORDER' : (table.amount || table.time || table.label || table.status)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-surface-container-low p-2 rounded-2xl shrink-0">
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high hover:bg-surface-bright rounded-xl text-on-surface text-sm font-bold transition-all border border-outline-variant"
        >
          <Calendar className="w-4 h-4" />
          Booking calendar
        </button>
        <button
          type="button"
          className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-high hover:bg-surface-bright rounded-xl text-on-surface text-sm font-bold transition-all border border-outline-variant"
        >
          <Edit3 className="w-4 h-4" />
          Edit floor plan
        </button>
      </div>
    </div>
  );
}

function OrderRow({ order, formatMoney }: { order: Order; formatMoney: (n: number) => string }) {
  const time = new Date(order.createdAtIso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const linePreview = order.items.map(it => `${it.qty}× ${it.nameSnapshot}`).join(' · ');

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-3 text-left">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-black text-on-surface truncate">{order.table}</p>
          <p className="text-[10px] font-mono text-on-surface-variant mt-0.5">{order.id}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-black text-primary">{formatMoney(order.total)}</p>
          <p className="text-[10px] text-on-surface-variant flex items-center justify-end gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            {time}
          </p>
        </div>
      </div>
      <p className="text-[10px] text-on-surface-variant mt-2 line-clamp-2">{linePreview}</p>
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
