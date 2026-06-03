import React, { createContext, useContext, useMemo, useReducer } from 'react';
import kitchenData from '../../mock/kitchen.json';
import type { KitchenTicket, KitchenOrderStatus, SendToKitchenInput } from './types';

function inferStation(category?: string): string {
  const c = (category ?? '').toLowerCase();
  if (c.includes('drink') || c.includes('beverage')) return 'Bar';
  if (c.includes('dessert')) return 'Dessert';
  if (c.includes('pizza')) return 'Pasta';
  if (c.includes('salad') || c.includes('starter') || c.includes('cold') || c.includes('bowl')) return 'Cold';
  return 'Grill';
}

const INITIAL_TICKETS: KitchenTicket[] = kitchenData.items.map((item) => ({
  id: item.id,
  table: item.table,
  server: item.server,
  status: item.status as KitchenOrderStatus,
  priority: item.priority as KitchenTicket['priority'],
  placedAt: Date.now() + item.placedAtOffset,
  items: item.items.map((i) => ({ ...i, done: i.done })),
  station: item.station,
  guests: item.guests,
}));

type State = { tickets: KitchenTicket[] };

type Action =
  | { type: 'send'; input: SendToKitchenInput }
  | { type: 'status'; id: string; status: KitchenOrderStatus }
  | { type: 'toggleItem'; orderId: string; itemIdx: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'send': {
      const { input } = action;
      if (state.tickets.some((t) => t.id === input.orderId && t.status !== 'Served')) {
        return state;
      }
      const station = inferStation(input.items[0]?.category);
      const totalQty = input.items.reduce((s, i) => s + i.qty, 0);
      const ticket: KitchenTicket = {
        id: input.orderId,
        table: input.table,
        server: 'POS Terminal',
        status: 'Pending',
        priority: input.serviceChannel === 'delivery' || totalQty >= 6 ? 'rush' : 'normal',
        placedAt: Date.now(),
        station,
        guests: Math.max(1, Math.min(8, totalQty)),
        items: input.items.map((i) => ({
          name: i.name,
          qty: i.qty,
          note: input.notes?.trim() || undefined,
          done: false,
        })),
      };
      return { tickets: [ticket, ...state.tickets] };
    }
    case 'status':
      return {
        tickets: state.tickets.map((t) =>
          t.id === action.id ? { ...t, status: action.status } : t
        ),
      };
    case 'toggleItem':
      return {
        tickets: state.tickets.map((t) =>
          t.id === action.orderId
            ? {
                ...t,
                items: t.items.map((it, i) =>
                  i === action.itemIdx ? { ...it, done: !it.done } : it
                ),
              }
            : t
        ),
      };
    default:
      return state;
  }
}

const KitchenContext = createContext<{
  tickets: KitchenTicket[];
  actions: {
    sendToKitchen: (input: SendToKitchenInput) => void;
    setStatus: (id: string, status: KitchenOrderStatus) => void;
    toggleItem: (orderId: string, itemIdx: number) => void;
  };
} | null>(null);

export function KitchenProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { tickets: INITIAL_TICKETS });

  const actions = useMemo(
    () => ({
      sendToKitchen: (input: SendToKitchenInput) => dispatch({ type: 'send', input }),
      setStatus: (id: string, status: KitchenOrderStatus) =>
        dispatch({ type: 'status', id, status }),
      toggleItem: (orderId: string, itemIdx: number) =>
        dispatch({ type: 'toggleItem', orderId, itemIdx }),
    }),
    []
  );

  const value = useMemo(
    () => ({ tickets: state.tickets, actions }),
    [state.tickets, actions]
  );

  return <KitchenContext.Provider value={value}>{children}</KitchenContext.Provider>;
}

export function useKitchen() {
  const ctx = useContext(KitchenContext);
  if (!ctx) throw new Error('useKitchen must be used within KitchenProvider');
  return ctx;
}
