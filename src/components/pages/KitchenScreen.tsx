import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat, Flame, Clock, CheckCircle2, AlertTriangle,
  Bell, RefreshCw, Monitor, Zap, Coffee, UtensilsCrossed,
} from 'lucide-react';
import kitchenData from '../../mock/kitchen.json';

type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';
type Priority = 'rush' | 'normal';
type KitchenItem = { name: string; qty: number; note?: string; done: boolean };
type KitchenOrder = {
  id: string; table: string; server: string; status: OrderStatus;
  priority: Priority; placedAt: number; items: KitchenItem[];
  station: string; guests: number;
};

const STATIONS: string[] = kitchenData.stations;
const INITIAL_KITCHEN_ORDERS: KitchenOrder[] = kitchenData.items.map((item) => ({
  ...item,
  status: item.status as OrderStatus,
  priority: item.priority as Priority,
  placedAt: Date.now() + item.placedAtOffset,
  items: item.items as KitchenItem[],
}));


function useTimer(placedAt: number) {
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - placedAt) / 1000));
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - placedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [placedAt]);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  return { display: `${m}:${String(s).padStart(2, '0')}`, minutes: m };
}

const statusCfg: Record<OrderStatus, { label: string; color: string; bg: string; border: string; headerBg: string }> = {
  Pending:   { label: 'Pending',   color: 'text-tertiary',  bg: 'bg-tertiary/10',  border: 'border-tertiary/40',  headerBg: 'bg-tertiary/15'  },
  Preparing: { label: 'Preparing', color: 'text-primary',   bg: 'bg-primary/10',   border: 'border-primary/40',   headerBg: 'bg-primary/15'   },
  Ready:     { label: 'Ready',     color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/40', headerBg: 'bg-secondary/15' },
  Served:    { label: 'Served',    color: 'text-on-surface-variant', bg: 'bg-surface-container-highest', border: 'border-outline-variant', headerBg: 'bg-surface-container-high' },
};

function TimerBadge({ placedAt, status }: { placedAt: number; status: OrderStatus }) {
  const { display, minutes } = useTimer(placedAt);
  const urgent = minutes >= 15 && status !== 'Ready';
  const warn   = minutes >= 10 && status !== 'Ready';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
      urgent ? 'bg-error/15 text-error animate-pulse' :
      warn   ? 'bg-tertiary/15 text-tertiary' :
               'bg-surface-container-highest text-on-surface-variant'
    }`}>
      <Clock className="w-3 h-3" />{display}
    </span>
  );
}

function OrderCard({ order, onStatusChange, onItemToggle }: {
  order: KitchenOrder;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onItemToggle: (orderId: string, itemIdx: number) => void;
}) {
  const cfg      = statusCfg[order.status];
  const doneCount = order.items.filter(i => i.done).length;
  const progress  = Math.round((doneCount / order.items.length) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`bg-surface-container-high rounded-2xl border-2 ${cfg.border} flex flex-col overflow-hidden`}
    >
      {/* Card header */}
      <div className={`${cfg.headerBg} px-4 py-3 flex items-start justify-between gap-2`}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold font-headline text-on-surface text-base">{order.table}</span>
          {order.priority === 'rush' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-error text-white">
              <Flame className="w-2.5 h-2.5" /> RUSH
            </span>
          )}
          <span className="text-[10px] text-on-surface-variant font-mono">{order.id}</span>
        </div>
        <TimerBadge placedAt={order.placedAt} status={order.status} />
      </div>

      {/* Server + station */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <p className="text-xs text-on-surface-variant">{order.server} · {order.guests} guest{order.guests > 1 ? 's' : ''}</p>
        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">{order.station}</span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] text-on-surface-variant">{doneCount}/{order.items.length} items done</span>
          <span className="text-[10px] font-bold text-on-surface-variant">{progress}%</span>
        </div>
        <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
            className={`h-full rounded-full ${order.status === 'Ready' ? 'bg-secondary' : 'bg-primary'}`}
          />
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pb-3 space-y-1.5 flex-1">
        {order.items.map((item, idx) => (
          <button
            key={idx}
            onClick={() => order.status !== 'Ready' && onItemToggle(order.id, idx)}
            className={`w-full flex items-start gap-2.5 p-2 rounded-xl transition-all text-left ${
              item.done
                ? 'bg-secondary/10 opacity-60'
                : 'bg-surface-container-low hover:bg-surface-bright'
            } ${order.status === 'Ready' ? 'cursor-default' : 'cursor-pointer'}`}
          >
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              item.done ? 'bg-secondary border-secondary' : 'border-outline'
            }`}>
              {item.done && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold leading-tight ${item.done ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                <span className="text-primary font-bold">{item.qty}x</span> {item.name}
              </p>
              {item.note && (
                <p className="text-[10px] text-tertiary mt-0.5 flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" />{item.note}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 pt-1 flex gap-2">
        {order.status === 'Pending' && (
          <button
            onClick={() => onStatusChange(order.id, 'Preparing')}
            className="flex-1 py-2 bg-primary text-on-primary-container font-semibold rounded-xl text-xs hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
          >
            <ChefHat className="w-3.5 h-3.5" /> Start Preparing
          </button>
        )}
        {order.status === 'Preparing' && (
          <button
            onClick={() => onStatusChange(order.id, 'Ready')}
            disabled={doneCount < order.items.length}
            className="flex-1 py-2 bg-secondary text-white font-semibold rounded-xl text-xs hover:brightness-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5" /> Mark Ready
          </button>
        )}
        {order.status === 'Ready' && (
          <div className="flex-1 py-2 bg-secondary/15 text-secondary font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Serve
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function KitchenScreen() {
  const [orders, setOrders]       = useState<KitchenOrder[]>(INITIAL_KITCHEN_ORDERS);
  const [station, setStation]     = useState('All');
  const [view, setView]           = useState<'board' | 'list'>('board');
  const [tick, setTick]           = useState(0);

  // Re-render every second for timers
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const onStatusChange = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const onItemToggle = (orderId: string, itemIdx: number) => {
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, items: o.items.map((it, i) => i === itemIdx ? { ...it, done: !it.done } : it) }
        : o
    ));
  };

  const filtered = orders.filter(o =>
    o.status !== 'Served' &&
    (station === 'All' || o.station === station)
  );

  const pending   = filtered.filter(o => o.status === 'Pending').length;
  const preparing = filtered.filter(o => o.status === 'Preparing').length;
  const ready     = filtered.filter(o => o.status === 'Ready').length;
  const rush      = filtered.filter(o => o.priority === 'rush').length;

  const columns: { status: OrderStatus; orders: KitchenOrder[] }[] = [
    { status: 'Pending',   orders: filtered.filter(o => o.status === 'Pending')   },
    { status: 'Preparing', orders: filtered.filter(o => o.status === 'Preparing') },
    { status: 'Ready',     orders: filtered.filter(o => o.status === 'Ready')     },
  ];

  return (
    <div className="flex flex-col min-h-full overflow-x-hidden bg-surface-container-lowest">

      {/* KDS Header */}
      <div className="bg-surface-container-low border-b border-outline-variant px-4 sm:px-6 py-4 flex flex-wrap items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <Monitor className="w-5 h-5 text-on-primary-container" />
          </div>
          <div>
            <h1 className="font-bold font-headline text-on-surface text-lg leading-none">Kitchen Display</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">Live order board · auto-refreshing</p>
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-2 flex-wrap">
          {[
            { label: 'Pending',   value: pending,   color: 'text-tertiary',  bg: 'bg-tertiary/10'  },
            { label: 'Preparing', value: preparing, color: 'text-primary',   bg: 'bg-primary/10'   },
            { label: 'Ready',     value: ready,     color: 'text-secondary', bg: 'bg-secondary/10' },
            { label: 'Rush',      value: rush,      color: 'text-error',     bg: 'bg-error/10'     },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${s.bg}`}>
              <span className={`text-lg font-bold font-headline ${s.color}`}>{s.value}</span>
              <span className={`text-[10px] font-bold uppercase ${s.color}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Station filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <div className="flex bg-surface-container-high rounded-xl p-1 border border-outline-variant gap-0.5 flex-nowrap">
            {STATIONS.map(s => (
              <button key={s} onClick={() => setStation(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${station === s ? 'bg-primary text-on-primary-container shadow' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {columns.map(col => {
          const cfg = statusCfg[col.status];
          return (
            <div key={col.status} className="flex flex-col border-b md:border-b-0 md:border-r border-outline-variant last:border-b-0 md:last:border-r-0 overflow-hidden">
              {/* Column header */}
              <div className={`px-3 sm:px-4 py-3 border-b border-outline-variant flex items-center justify-between ${cfg.headerBg}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</span>
                  <span className={`w-5 h-5 rounded-full ${cfg.bg} ${cfg.color} text-[10px] font-bold flex items-center justify-center`}>
                    {col.orders.length}
                  </span>
                </div>
                {col.status === 'Pending' && <Zap className={`w-4 h-4 ${cfg.color}`} />}
                {col.status === 'Preparing' && <ChefHat className={`w-4 h-4 ${cfg.color}`} />}
                {col.status === 'Ready' && <Bell className={`w-4 h-4 ${cfg.color}`} />}
              </div>

              {/* Cards */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <AnimatePresence>
                  {/* Rush orders first */}
                  {[...col.orders]
                    .sort((a, b) => {
                      if (a.priority === 'rush' && b.priority !== 'rush') return -1;
                      if (b.priority === 'rush' && a.priority !== 'rush') return 1;
                      return a.placedAt - b.placedAt;
                    })
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={onStatusChange}
                        onItemToggle={onItemToggle}
                      />
                    ))}
                </AnimatePresence>
                {col.orders.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 gap-2 text-on-surface-variant">
                    <UtensilsCrossed className="w-6 h-6 opacity-30" />
                    <p className="text-xs opacity-50">No {col.status.toLowerCase()} orders</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer ticker */}
      <div className="bg-surface-container-low border-t border-outline-variant px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4 text-xs text-on-surface-variant flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            Kitchen Live
          </span>
          <span>Avg prep time: <span className="font-bold text-on-surface">14 min</span></span>
          <span>Completed today: <span className="font-bold text-on-surface">38 orders</span></span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
          <RefreshCw className="w-3 h-3" />
          Auto-refresh every 1s
        </div>
      </div>
    </div>
  );
}
