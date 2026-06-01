import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChefHat, CheckCircle2, Clock, Flame, SendHorizonal, AlertTriangle } from 'lucide-react';

const PENDING_ORDERS = [
  { id: 'ORD-1041', table: 'Table 3',  server: 'Julian R.',  items: ['2x Wagyu Burger', '1x Truffle Fries', '2x Cabernet Sauvignon'], priority: 'high'   },
  { id: 'ORD-1038', table: 'Table 12', server: 'Julian R.',  items: ['1x Miso Cod', '1x Tuna Tartare'],                               priority: 'normal' },
  { id: 'ORD-1037', table: 'Table 5',  server: 'Derrick S.', items: ['2x Truffle Pasta', '1x Crème Brûlée'],                          priority: 'normal' },
];

interface SendToKitchenModalProps {
  onClose: () => void;
}

export function SendToKitchenModal({ onClose }: SendToKitchenModalProps) {
  const [selected, setSelected]   = useState<string[]>(PENDING_ORDERS.map(o => o.id));
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [note, setNote]           = useState('');

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleSend = () => {
    if (selected.length === 0) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1500);
    setTimeout(() => onClose(), 3200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={!sending && !sent ? onClose : undefined} />

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl z-10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <ChefHat className="w-5 h-5 text-on-primary-container" />
            </div>
            <div>
              <h2 className="font-bold font-headline text-on-surface">Send to Kitchen</h2>
              <p className="text-xs text-on-surface-variant">{PENDING_ORDERS.length} orders pending · select to send</p>
            </div>
          </div>
          {!sending && !sent && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sent success state */}
        <AnimatePresence>
          {sent && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <p className="font-bold font-headline text-on-surface text-lg">Sent to Kitchen!</p>
                <p className="text-sm text-on-surface-variant mt-1">{selected.length} order{selected.length !== 1 ? 's' : ''} dispatched to the kitchen terminal.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Order list */}
        {!sent && (
          <>
            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {PENDING_ORDERS.map(order => {
                const isSelected = selected.includes(order.id);
                return (
                  <button key={order.id} onClick={() => toggle(order.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected ? 'bg-primary/10 border-primary/40' : 'bg-surface-container-high border-outline-variant hover:bg-surface-bright'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-primary border-primary' : 'border-outline'}`}>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-on-primary-container" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-on-surface text-sm">{order.table}</span>
                            <span className="text-[10px] text-on-surface-variant font-mono">{order.id}</span>
                            {order.priority === 'high' && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-error/10 text-error">
                                <Flame className="w-2.5 h-2.5" /> Rush
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-on-surface-variant mt-0.5">{order.server}</p>
                        </div>
                      </div>
                      <Clock className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5" />
                    </div>
                    <div className="mt-2 ml-8 flex flex-wrap gap-1">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-[10px] bg-surface-container-highest text-on-surface-variant px-2 py-0.5 rounded-full">{item}</span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Kitchen note */}
            <div className="px-4 pb-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Kitchen Note (optional)</label>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Table 3 has a nut allergy"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-outline-variant flex items-center gap-3">
              {selected.length === 0 && (
                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                  <AlertTriangle className="w-3.5 h-3.5" /> Select at least one order
                </div>
              )}
              <div className="ml-auto flex gap-3">
                <button onClick={onClose} className="px-4 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">
                  Cancel
                </button>
                <button onClick={handleSend} disabled={selected.length === 0 || sending}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
                  {sending
                    ? <><span className="w-4 h-4 border-2 border-on-primary-container/30 border-t-on-primary-container rounded-full animate-spin" /> Sending…</>
                    : <><SendHorizonal className="w-4 h-4" /> Send {selected.length} Order{selected.length !== 1 ? 's' : ''}</>}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
