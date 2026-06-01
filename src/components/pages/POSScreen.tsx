import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingBag,
  Sandwich, Pizza, Utensils, CupSoda, Armchair, Truck, Search, ChevronLeft, ChevronRight, Printer,
} from 'lucide-react';
import { BillOrder } from './BillSlipScreen';
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import type { MenuItem, Promotion, ServiceChannel } from '../../lib/pos/types';
import { menuItemAvailability } from '../../lib/pos/selectors';
import { computeOrderPricing } from '../../lib/pos/promotionPricing';

type CartItem = MenuItem & { qty: number };

const MENU_PAGE_SIZE = 12;

type Props = {
  /** Completes sale, opens receipt, and triggers print (single action). */
  onCharge: (order: BillOrder) => void;
};

function serviceChannelLabel(c: ServiceChannel): string {
  if (c === 'dine_in') return 'Dine-in';
  if (c === 'takeaway') return 'Takeaway';
  return 'Delivery';
}

export function POSScreen({ onCharge }: Props) {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [serviceChannel, setServiceChannel] = useState<ServiceChannel>('dine_in');
  const [table, setTable] = useState('Table 7');
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [deliveryContactName, setDeliveryContactName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Card');
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>('');
  const [menuSearch, setMenuSearch] = useState('');
  const [menuPage, setMenuPage] = useState(1);

  const activePromotions = useMemo(() => state.promotions.filter(p => p.active), [state.promotions]);
  const menuBy = useMemo(() => Object.fromEntries(state.menu.map(m => [m.id, m])), [state.menu]);

  useEffect(() => {
    if (!selectedPromotionId) return;
    const stillActive = activePromotions.some(p => p.id === selectedPromotionId);
    if (!stillActive) setSelectedPromotionId('');
  }, [activePromotions, selectedPromotionId]);

  const selectedPromotion: Promotion | null = useMemo(() => {
    if (!selectedPromotionId) return null;
    return activePromotions.find(p => p.id === selectedPromotionId) ?? null;
  }, [activePromotions, selectedPromotionId]);

  const pricing = useMemo(
    () =>
      computeOrderPricing(
        cart.map(c => ({ menuItemId: c.id, qty: c.qty })),
        menuBy,
        0.1,
        selectedPromotion
      ),
    [cart, menuBy, selectedPromotion]
  );

  const { grossSubtotal, discountTotal, subtotal, tax, total } = pricing;

  const cartTitle = useMemo(() => {
    if (serviceChannel === 'dine_in') return table;
    if (serviceChannel === 'takeaway') return pickupName.trim() ? `Pickup · ${pickupName.trim()}` : 'Takeaway pickup';
    const n = deliveryContactName.trim();
    const a = deliveryAddress.trim();
    if (n && a) return `${n} — ${a.slice(0, 28)}${a.length > 28 ? '…' : ''}`;
    if (a) return a.slice(0, 36) + (a.length > 36 ? '…' : '');
    return 'Delivery';
  }, [serviceChannel, table, pickupName, deliveryContactName, deliveryAddress]);

  const POS_CATEGORIES = ['All', ...Array.from(new Set(state.menu.map(m => m.category)))];
  const filtered = useMemo(() => {
    const base = (activeCategory === 'All' ? state.menu : state.menu.filter(i => i.category === activeCategory))
      .filter(mi => menuItemAvailability(state, mi) !== 'out_of_stock');
    const q = menuSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(mi => {
      const name = mi.name.toLowerCase();
      const cat = mi.category.toLowerCase();
      const priceStr = String(mi.price);
      return name.includes(q) || cat.includes(q) || priceStr.includes(q);
    });
  }, [activeCategory, state.menu, state, menuSearch]);

  const menuTotalPages = Math.max(1, Math.ceil(filtered.length / MENU_PAGE_SIZE));
  const menuPageSafe = Math.min(menuPage, menuTotalPages);
  const pagedMenu = useMemo(
    () => filtered.slice((menuPageSafe - 1) * MENU_PAGE_SIZE, menuPageSafe * MENU_PAGE_SIZE),
    [filtered, menuPageSafe]
  );

  useEffect(() => {
    setMenuPage(p => Math.min(p, menuTotalPages));
  }, [menuTotalPages]);

  const iconFor = (item: MenuItem) => {
    if (item.posIcon === 'Sandwich') return Sandwich;
    if (item.posIcon === 'Pizza') return Pizza;
    if (item.posIcon === 'CupSoda') return CupSoda;
    return Utensils;
  };

  const addToCart = (item: MenuItem) => {
    setChargeError(null);
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setChargeError(null);
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: c.qty + delta } : c).filter(c => c.qty > 0));
  };

  const handleCharge = () => {
    if (cart.length === 0) return;
    setChargeError(null);

    const result = actions.orders.place({
      table,
      paymentMethod,
      items: cart.map(c => ({ menuItemId: c.id, qty: c.qty })),
      taxRate: 0.1,
      promotionId: selectedPromotionId || null,
      serviceChannel,
      customerName:
        serviceChannel === 'takeaway'
          ? pickupName
          : serviceChannel === 'delivery'
            ? deliveryContactName
            : undefined,
      customerPhone:
        serviceChannel === 'takeaway'
          ? pickupPhone.trim() || undefined
          : serviceChannel === 'delivery'
            ? deliveryPhone
            : undefined,
      deliveryAddress: serviceChannel === 'delivery' ? deliveryAddress : undefined,
      deliveryNotes: serviceChannel === 'delivery' ? deliveryNotes : undefined,
    });

    if (!result || typeof result.ok !== 'boolean') {
      setChargeError('Unexpected response from the register. Please reload the page.');
      return;
    }

    if (result.ok === false) {
      let msg = result.reason;
      const ins = result.details?.insufficient;
      if (Array.isArray(ins) && ins.length > 0) {
        const lines = ins.map(
          (r: { name: string; have: number; need: number; unit: string }) =>
            `${r.name}: have ${r.have} ${r.unit}, need ${r.need} ${r.unit}`
        );
        msg = `${msg} ${lines.join(' · ')}. Restock in Inventory or use Settings to reset demo data.`;
      }
      setChargeError(msg);
      return;
    }

    const order: BillOrder = {
      id: result.order.id,
      table: result.order.table,
      items: cart.map((c, idx) => ({ id: idx, name: c.name, price: c.price, qty: c.qty })),
      grossSubtotal: result.order.grossSubtotal,
      discountTotal: result.order.discountTotal,
      subtotal: result.order.subtotal,
      tax: result.order.tax,
      total: result.order.total,
      promotionSummary: result.order.promotionName,
      paymentMethod,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      serviceChannel: result.order.serviceChannel,
      customerName: result.order.customerName,
      customerPhone: result.order.customerPhone,
      deliveryAddress: result.order.deliveryAddress,
      deliveryNotes: result.order.deliveryNotes,
    };

    onCharge(order);
    setCart([]); // Clear cart after charging
  };

  const fieldClass =
    'w-full bg-surface-container-highest border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/80 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40';
  const labelClass = 'text-xs font-bold text-on-surface mb-1.5 block tracking-wide';

  return (
    <div className="flex flex-col lg:flex-row min-h-full overflow-x-hidden">

      {/* ── Menu / items (primary) ── */}
      <div className="flex-1 flex flex-col min-w-0">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-outline-variant shrink-0">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold font-headline text-on-surface">Point of Sale</h1>
            <p className="text-sm text-on-surface-variant mt-1 leading-snug max-w-xl">
              Tap items to add. Service type, table, and payment are on the order column (right on large screens, below on phones).
            </p>
          </div>
        </div>

        <div className="flex gap-2 px-4 sm:px-6 py-2.5 border-b border-outline-variant overflow-x-auto shrink-0">
          {POS_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setMenuPage(1);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-primary text-on-primary-container shadow-sm'
                  : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="shrink-0 px-4 sm:px-6 py-2.5 border-b border-outline-variant bg-surface-container-low/40">
          <label htmlFor="pos-menu-search" className="sr-only">Search menu</label>
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" aria-hidden />
            <input
              id="pos-menu-search"
              type="search"
              value={menuSearch}
              onChange={e => {
                setMenuSearch(e.target.value);
                setMenuPage(1);
              }}
              placeholder="Filter by name, category, or price…"
              className={`${fieldClass} pl-10 pr-10`}
              autoComplete="off"
            />
            {menuSearch.trim() !== '' && (
              <button
                type="button"
                onClick={() => { setMenuSearch(''); setMenuPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-on-surface-variant hover:text-on-surface px-2 py-1 rounded-lg hover:bg-surface-bright"
              >
                Clear
              </button>
            )}
          </div>
          {filtered.length > 0 && (
            <p className="text-xs text-on-surface-variant mt-2 tabular-nums">
              Showing {(menuPageSafe - 1) * MENU_PAGE_SIZE + 1}-{Math.min(menuPageSafe * MENU_PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
          )}
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-w-[1600px] mx-auto">
            {pagedMenu.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-highest/40">
                <Search className="w-10 h-10 text-on-surface-variant/60 mb-3" aria-hidden />
                <p className="text-sm font-semibold text-on-surface">No dishes match</p>
                <p className="text-sm text-on-surface-variant mt-1 max-w-sm">
                  Try another category or clear the search filter.
                </p>
              </div>
            ) : (
              <>
                {pagedMenu.map((item, i) => {
                  const Icon = iconFor(item);
                  const inCart = cart.find(c => c.id === item.id);
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => addToCart(item)}
                      className={`relative bg-surface-container-high hover:bg-surface-bright border rounded-2xl p-4 sm:p-4 text-left transition-all active:scale-[0.98] group min-h-[120px] ${
                        inCart ? 'border-primary ring-2 ring-primary/25' : 'border-outline-variant'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-sm sm:text-base font-semibold text-on-surface leading-snug pr-6">{item.name}</p>
                      <p className="text-primary font-bold text-sm sm:text-base mt-2 tabular-nums">{formatMoney(item.price)}</p>
                      {inCart && (
                        <span className="absolute top-3 right-3 min-w-[1.5rem] h-6 px-1 rounded-full bg-primary text-on-primary-container text-xs font-black flex items-center justify-center">
                          {inCart.qty}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {filtered.length > 0 && menuTotalPages > 1 && (
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-outline-variant bg-surface-container-low/60">
            <button
              type="button"
              disabled={menuPageSafe <= 1}
              onClick={() => setMenuPage(p => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border border-outline-variant bg-surface-container-highest text-on-surface hover:bg-surface-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden />
              Prev
            </button>
            <span className="text-sm font-semibold text-on-surface-variant tabular-nums">
              Page <span className="text-on-surface">{menuPageSafe}</span> of {menuTotalPages}
            </span>
            <button
              type="button"
              disabled={menuPageSafe >= menuTotalPages}
              onClick={() => setMenuPage(p => Math.min(menuTotalPages, p + 1))}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold border border-outline-variant bg-surface-container-highest text-on-surface hover:bg-surface-bright disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        )}
      </div>

      {/* ── Order & checkout (readable width, scroll + fixed footer) ── */}
      <div className="flex flex-col border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-low lg:w-[min(100%,26rem)] xl:w-[28rem] 2xl:w-[30rem] shrink-0 lg:max-w-[40vw]">
        <div className="flex-1 flex flex-col">
          <div>
            <div className="p-4 sm:p-5 space-y-5 border-b border-outline-variant/80 bg-surface-container-low">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant mb-3">How is this order served?</p>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'dine_in' as const, icon: Armchair, label: 'Dine-in' },
                      { id: 'takeaway' as const, icon: ShoppingBag, label: 'Pickup' },
                      { id: 'delivery' as const, icon: Truck, label: 'Delivery' },
                    ] as const
                  ).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setChargeError(null);
                        setServiceChannel(id);
                      }}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl text-xs font-bold border-2 transition-all min-h-[4.25rem] ${
                        serviceChannel === id
                          ? 'bg-primary text-on-primary-container border-primary shadow-md'
                          : 'bg-surface-container-highest text-on-surface border-outline-variant hover:border-on-surface/20'
                      }`}
                    >
                      <Icon className="w-5 h-5 shrink-0" />
                      <span className="leading-tight text-center">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {serviceChannel === 'dine_in' && (
                <div>
                  <label htmlFor="pos-table" className={labelClass}>Table</label>
                  <select
                    id="pos-table"
                    value={table}
                    onChange={e => { setChargeError(null); setTable(e.target.value); }}
                    className={fieldClass}
                  >
                    {['Table 1', 'Table 2', 'Table 5', 'Table 7', 'Table 10', 'Bar'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              )}

              {serviceChannel === 'takeaway' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="pos-pickup-name" className={labelClass}>Pickup name *</label>
                    <input
                      id="pos-pickup-name"
                      value={pickupName}
                      onChange={e => { setChargeError(null); setPickupName(e.target.value); }}
                      placeholder="Guest or ticket name"
                      className={fieldClass}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-pickup-phone" className={labelClass}>Phone <span className="font-normal text-on-surface-variant">(optional)</span></label>
                    <input
                      id="pos-pickup-phone"
                      value={pickupPhone}
                      onChange={e => { setChargeError(null); setPickupPhone(e.target.value); }}
                      placeholder="SMS when ready"
                      className={fieldClass}
                      inputMode="tel"
                    />
                  </div>
                </div>
              )}

              {serviceChannel === 'delivery' && (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="pos-del-name" className={labelClass}>Contact name</label>
                    <input
                      id="pos-del-name"
                      value={deliveryContactName}
                      onChange={e => { setChargeError(null); setDeliveryContactName(e.target.value); }}
                      placeholder="Recipient"
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-del-phone" className={labelClass}>Phone *</label>
                    <input
                      id="pos-del-phone"
                      value={deliveryPhone}
                      onChange={e => { setChargeError(null); setDeliveryPhone(e.target.value); }}
                      placeholder="Required"
                      className={fieldClass}
                      inputMode="tel"
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-del-addr" className={labelClass}>Address *</label>
                    <textarea
                      id="pos-del-addr"
                      value={deliveryAddress}
                      onChange={e => { setChargeError(null); setDeliveryAddress(e.target.value); }}
                      placeholder="Street, unit, city"
                      rows={3}
                      className={`${fieldClass} resize-y min-h-[5rem]`}
                    />
                  </div>
                  <div>
                    <label htmlFor="pos-del-notes" className={labelClass}>Notes</label>
                    <input
                      id="pos-del-notes"
                      value={deliveryNotes}
                      onChange={e => { setChargeError(null); setDeliveryNotes(e.target.value); }}
                      placeholder="Gate code, allergies…"
                      className={fieldClass}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-low/90">
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold font-headline text-on-surface text-base leading-snug break-words">{cartTitle}</h2>
                  <p className="text-xs font-bold uppercase text-primary mt-1 tracking-wide">{serviceChannelLabel(serviceChannel)}</p>
                  <p className="text-sm text-on-surface-variant mt-2">
                    {cart.length === 0
                      ? 'No line items yet — add from the menu.'
                      : `${cart.reduce((s, c) => s + c.qty, 0)} item${cart.reduce((s, c) => s + c.qty, 0) !== 1 ? 's' : ''} in this order`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-3 pb-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-on-surface-variant rounded-2xl border border-dashed border-outline-variant bg-surface-container-highest/50">
                  <ShoppingBag className="w-10 h-10 opacity-60" />
                  <p className="text-sm font-medium text-center px-4">Cart is empty — choose dishes on the left</p>
                </div>
              ) : (
                cart.map(item => {
                  const Icon = iconFor(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 bg-surface-container-highest rounded-xl p-3.5 border border-outline-variant"
                    >
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface leading-snug">{item.name}</p>
                        <p className="text-sm text-primary font-bold tabular-nums mt-0.5">{formatMoney(item.price * item.qty)}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, -1)}
                          className="w-9 h-9 rounded-lg bg-surface-bright hover:bg-error/15 hover:text-error text-on-surface-variant flex items-center justify-center transition-colors"
                          aria-label="Decrease quantity"
                        >
                          {item.qty === 1 ? <Trash2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        </button>
                        <span className="w-8 text-center text-sm font-black text-on-surface tabular-nums">{item.qty}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(item.id, 1)}
                          className="w-9 h-9 rounded-lg bg-surface-bright hover:bg-primary/15 hover:text-primary text-on-surface-variant flex items-center justify-center transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t-2 border-primary/30 bg-surface-container-highest p-4 sm:p-5 space-y-4 shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
          <div>
            <label htmlFor="pos-deal" className={labelClass}>Deal (optional)</label>
            <select
              id="pos-deal"
              value={selectedPromotionId}
              onChange={e => { setChargeError(null); setSelectedPromotionId(e.target.value); }}
              className={fieldClass}
            >
              <option value="">No deal</option>
              {activePromotions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 text-sm">
            {discountTotal > 0.005 && (
              <>
                <div className="flex justify-between text-on-surface-variant gap-4">
                  <span>List</span>
                  <span className="tabular-nums font-medium text-on-surface">{formatMoney(grossSubtotal)}</span>
                </div>
                <div className="flex justify-between text-secondary font-semibold gap-4">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatMoney(discountTotal)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-on-surface-variant gap-4">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium text-on-surface">{formatMoney(subtotal)}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant gap-4">
              <span>Tax (10%)</span>
              <span className="tabular-nums font-medium text-on-surface">{formatMoney(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-on-surface text-lg pt-2 border-t border-outline-variant gap-4">
              <span>Total</span>
              <span className="text-primary tabular-nums">{formatMoney(total)}</span>
            </div>
          </div>

          <div>
            <p className={labelClass}>Payment</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: CreditCard, label: 'Card' },
                { icon: Banknote, label: 'Cash' },
                { icon: Smartphone, label: 'Tap' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setPaymentMethod(label)}
                  className={`flex flex-col items-center gap-2 py-3.5 border-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
                    paymentMethod === label
                      ? 'bg-primary/15 text-primary border-primary/50'
                      : 'bg-surface-container-low text-on-surface-variant hover:text-on-surface border-outline-variant'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={handleCharge}
            className="w-full py-3.5 bg-primary text-on-primary-container font-black text-base rounded-xl hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg uppercase tracking-wide flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5 shrink-0" aria-hidden />
            Charge and print {formatMoney(total)}
          </button>
          {chargeError && (
            <p className="text-sm text-error font-semibold leading-snug bg-error/10 border border-error/30 rounded-xl px-3 py-2">{chargeError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
