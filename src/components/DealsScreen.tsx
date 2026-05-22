import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Tag,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  Percent,
  CircleDollarSign,
  Gift,
  Package,
} from 'lucide-react';
import { Pagination } from './Pagination';
import { usePos } from '../lib/pos/store';
import type { Promotion } from '../lib/pos/types';
import { useAppSettings } from '../lib/appSettings';

type DealSubTab = 'bogo' | 'discount' | 'package';

type DiscountSubtype = 'percent_off' | 'fixed_off_order';

/** Menu row for selects + package pricing (uses live menu prices). */
type MenuPickOption = { id: string; name: string; price: number };

type FormState = {
  name: string;
  description: string;
  active: boolean;
  discountSubtype: DiscountSubtype;
  percent: number;
  fixedAmount: number;
  bogoMenuItemId: string;
  packageLines: Array<{ menuItemId: string; qty: number }>;
  bundlePrice: number;
};

function emptyForm(menuIds: string[]): FormState {
  const packageLines =
    menuIds.length >= 3
      ? [
          { menuItemId: menuIds[0], qty: 1 },
          { menuItemId: menuIds[1], qty: 1 },
          { menuItemId: menuIds[2], qty: 1 },
        ]
      : [
          { menuItemId: menuIds[0] ?? '', qty: 1 },
          { menuItemId: menuIds[1] ?? '', qty: 1 },
          { menuItemId: '', qty: 1 },
        ];
  return {
    name: '',
    description: '',
    active: true,
    discountSubtype: 'percent_off',
    percent: 10,
    fixedAmount: 5,
    bogoMenuItemId: menuIds[0] ?? '',
    packageLines,
    bundlePrice: 0,
  };
}

function promotionInSubTab(p: Promotion, tab: DealSubTab): boolean {
  if (tab === 'bogo') return p.kind === 'bogo_menu_item';
  if (tab === 'discount') return p.kind === 'percent_off' || p.kind === 'fixed_off_order';
  return p.kind === 'package_deal';
}

function kindLabel(p: Promotion): string {
  if (p.kind === 'percent_off') return '% off order';
  if (p.kind === 'fixed_off_order') return 'Fixed off order';
  if (p.kind === 'bogo_menu_item') return 'BOGO item';
  return 'Package (3–4 items)';
}

/** Which top-level Deals tab owns this promotion (POS uses the same kinds). */
function dealSectionLabel(p: Promotion): string {
  if (p.kind === 'bogo_menu_item') return 'Buy 1 Get 1 Free';
  if (p.kind === 'package_deal') return 'Package deals';
  return 'Discount offers';
}

function parseNonNegativeMoney(raw: string, prev: number): number {
  if (raw === '' || raw === '.') return 0;
  const n = parseFloat(raw);
  if (!Number.isFinite(n) || n < 0) return Number.isFinite(prev) && prev >= 0 ? prev : 0;
  return n;
}

function normalizedPackageLines(
  form: FormState,
  menuOptions: MenuPickOption[]
): { menuItemId: string; qty: number }[] | null {
  const lines = form.packageLines
    .map(l => ({
      menuItemId: l.menuItemId.trim(),
      qty: Math.max(1, Math.floor(Number(l.qty) || 1)),
    }))
    .filter(l => l.menuItemId);
  if (lines.length < 3 || lines.length > 4) return null;
  const ids = new Set(lines.map(l => l.menuItemId));
  if (ids.size !== lines.length) return null;
  if (!lines.every(l => menuOptions.some(m => m.id === l.menuItemId))) return null;
  return lines;
}

function packageFormIssues(form: FormState, menuOptions: MenuPickOption[]): string | null {
  if (menuOptions.length < 3) {
    return 'Add at least 3 items to the menu before creating a package (Menu screen).';
  }
  const lines = normalizedPackageLines(form, menuOptions);
  if (!lines) {
    const filled = form.packageLines.filter(l => l.menuItemId.trim());
    if (filled.length > 0) {
      const ids = new Set(filled.map(l => l.menuItemId.trim()));
      if (ids.size !== filled.length) return 'Each package line must be a different menu item.';
    }
    return 'Pick 3 or 4 different menu items (use “Add fourth item” if needed).';
  }
  return null;
}

function PromotionModal({
  title,
  variant,
  onClose,
  onSave,
  form,
  setForm,
  menuOptions,
  formatMoney,
}: {
  title: string;
  variant: DealSubTab;
  onClose: () => void;
  onSave: () => void;
  form: FormState;
  setForm: (f: FormState) => void;
  menuOptions: MenuPickOption[];
  formatMoney: (n: number) => string;
}) {
  const f = (patch: Partial<FormState>) => setForm({ ...form, ...patch });

  const packageLinesValid = normalizedPackageLines(form, menuOptions) !== null;
  const bundlePriceSafe = Number.isFinite(form.bundlePrice) && form.bundlePrice >= 0 ? form.bundlePrice : 0;
  const packageHint = variant === 'package' ? packageFormIssues(form, menuOptions) : null;

  const packageMenuListTotal = useMemo(() => {
    let sum = 0;
    let count = 0;
    for (const row of form.packageLines) {
      const id = row.menuItemId.trim();
      if (!id) continue;
      const m = menuOptions.find(x => x.id === id);
      if (!m) continue;
      const q = Math.max(1, Math.floor(Number(row.qty) || 1));
      sum += m.price * q;
      count += 1;
    }
    return { sum, count };
  }, [form.packageLines, menuOptions]);

  const canSave =
    Boolean(form.name.trim()) &&
    (variant === 'bogo'
      ? menuOptions.some(m => m.id === form.bogoMenuItemId)
      : variant === 'discount'
        ? true
        : packageLinesValid);

  const setPackageLine = (index: number, patch: Partial<{ menuItemId: string; qty: number }>) => {
    const next = form.packageLines.map((row, i) => (i === index ? { ...row, ...patch } : row));
    setForm({ ...form, packageLines: next });
  };

  const addPackageRow = () => {
    if (form.packageLines.length >= 4) return;
    const used = new Set(form.packageLines.map(l => l.menuItemId));
    const nextId = menuOptions.find(m => !used.has(m.id))?.id ?? '';
    setForm({ ...form, packageLines: [...form.packageLines, { menuItemId: nextId, qty: 1 }] });
  };

  const removePackageRow = (index: number) => {
    if (form.packageLines.length <= 3) return;
    setForm({ ...form, packageLines: form.packageLines.filter((_, i) => i !== index) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl z-10 max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant shrink-0">
          <div>
            <h2 className="font-bold font-headline text-on-surface text-lg">{title}</h2>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">
              {variant === 'bogo' && 'Tab: Buy 1 Get 1 Free'}
              {variant === 'discount' && 'Tab: Discount offers'}
              {variant === 'package' && 'Tab: Package deals'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Deal name *</label>
            <input
              value={form.name}
              onChange={e => f({ name: e.target.value })}
              placeholder="e.g. Weekend combo"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Description</label>
            <textarea
              value={form.description}
              onChange={e => f({ description: e.target.value })}
              placeholder="Shown to staff on POS / receipts"
              rows={2}
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {variant === 'bogo' && (
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Menu item (BOGO applies here)</label>
              <select
                value={form.bogoMenuItemId}
                onChange={e => f({ bogoMenuItemId: e.target.value })}
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Select menu item…</option>
                {menuOptions.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {variant === 'discount' && (
            <>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Discount type</label>
                <select
                  value={form.discountSubtype}
                  onChange={e => f({ discountSubtype: e.target.value as DiscountSubtype })}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="percent_off">Percent off entire order</option>
                  <option value="fixed_off_order">Fixed amount off list subtotal</option>
                </select>
              </div>
              {form.discountSubtype === 'percent_off' && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Percent off (0–100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={Number.isFinite(form.percent) ? form.percent : 0}
                    onChange={e => {
                      const n = parseFloat(e.target.value);
                      f({ percent: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0 });
                    }}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}
              {form.discountSubtype === 'fixed_off_order' && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Amount off (order currency)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={Number.isFinite(form.fixedAmount) ? form.fixedAmount : 0}
                    onChange={e => f({ fixedAmount: parseNonNegativeMoney(e.target.value, form.fixedAmount) })}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}
            </>
          )}

          {variant === 'package' && (
            <>
              {packageHint && (
                <p className="text-xs font-semibold text-error bg-error/10 border border-error/25 rounded-xl px-3 py-2">
                  {packageHint}
                </p>
              )}
              <p className="text-xs text-on-surface-variant">
                Add 3 or 4 different menu lines. When the cart contains at least those quantities, each full set is charged{' '}
                <span className="font-semibold text-on-surface">bundle price</span> instead of list price for those items. Remaining quantities use list price.
              </p>
              <div className="space-y-3">
                {form.packageLines.map((row, index) => {
                  const id = row.menuItemId.trim();
                  const m = id ? menuOptions.find(x => x.id === id) : undefined;
                  const q = Math.max(1, Math.floor(Number(row.qty) || 1));
                  const unit = m?.price;
                  const lineExt = unit != null ? unit * q : null;
                  return (
                    <div key={index} className="rounded-xl border border-outline-variant bg-surface-container-high/80 p-3">
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-semibold text-on-surface-variant mb-1 block">Item {index + 1}</label>
                          <select
                            value={row.menuItemId}
                            onChange={e => setPackageLine(index, { menuItemId: e.target.value })}
                            className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                          >
                            <option value="">Select…</option>
                            {menuOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>
                                {opt.name} ({formatMoney(opt.price)})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20 shrink-0">
                          <label className="text-[10px] font-semibold text-on-surface-variant mb-1 block">Qty</label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={row.qty}
                            onChange={e => setPackageLine(index, { qty: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
                            className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-2 py-2 text-sm text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                          />
                        </div>
                        {form.packageLines.length > 3 && (
                          <button
                            type="button"
                            onClick={() => removePackageRow(index)}
                            className="shrink-0 mb-0.5 p-2 rounded-xl text-error hover:bg-error/10"
                            title="Remove line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {lineExt != null && (
                        <p className="text-[10px] text-on-surface-variant mt-2 pl-0.5">
                          <span className="font-semibold text-on-surface">Menu:</span>{' '}
                          {formatMoney(unit!)} each × {q} = <span className="font-bold text-on-surface">{formatMoney(lineExt)}</span>
                        </p>
                      )}
                      {id && !m && (
                        <p className="text-[10px] text-error mt-2">Menu item not found — pick from the list.</p>
                      )}
                    </div>
                  );
                })}
              </div>
              {packageMenuListTotal.count > 0 && (
                <div className="rounded-xl border border-outline-variant bg-surface-container-high p-3 text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold text-on-surface">
                    <span>Menu price total (lines above)</span>
                    <span>{formatMoney(packageMenuListTotal.sum)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Bundle price (per set)</span>
                    <span className="font-medium text-on-surface">{formatMoney(bundlePriceSafe)}</span>
                  </div>
                  {packageMenuListTotal.sum - bundlePriceSafe > 0.005 && (
                    <div className="flex justify-between text-secondary font-bold pt-1 border-t border-outline-variant">
                      <span>Savings vs menu (per set)</span>
                      <span>−{formatMoney(packageMenuListTotal.sum - bundlePriceSafe)}</span>
                    </div>
                  )}
                  {bundlePriceSafe - packageMenuListTotal.sum > 0.005 && (
                    <p className="text-[10px] text-tertiary pt-1">
                      Bundle is above the sum of these menu lines — no discount vs buying the same items separately at list price.
                    </p>
                  )}
                </div>
              )}
              {form.packageLines.length < 4 && (
                <button
                  type="button"
                  onClick={addPackageRow}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Add fourth item (optional)
                </button>
              )}
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Bundle price per complete set</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={Number.isFinite(form.bundlePrice) ? form.bundlePrice : 0}
                  onChange={e => f({ bundlePrice: parseNonNegativeMoney(e.target.value, form.bundlePrice) })}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">
                  Customer pays {formatMoney(bundlePriceSafe)} per complete bundle when all lines are in the cart.
                </p>
              </div>
            </>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2.5">
            <input
              id="deal-active"
              type="checkbox"
              checked={form.active}
              onChange={e => f({ active: e.target.checked })}
              className="rounded border-outline-variant text-primary focus:ring-primary/40"
            />
            <label htmlFor="deal-active" className="text-sm text-on-surface cursor-pointer">
              Active (selectable on POS)
            </label>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-outline-variant shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="flex-1 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            Save deal
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteConfirm({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-sm shadow-2xl z-10 p-6 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-error" />
        </div>
        <h3 className="font-bold font-headline text-on-surface text-lg mb-1">Remove deal</h3>
        <p className="text-sm text-on-surface-variant mb-6">
          Remove <span className="font-semibold text-on-surface">{`"${name}"`}</span>?
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2.5 bg-error text-white font-semibold rounded-xl hover:brightness-105 transition-all text-sm"
          >
            Remove
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function toPromotion(
  id: string,
  form: FormState,
  variant: DealSubTab,
  menuOptions: MenuPickOption[]
): Promotion | null {
  const name = form.name.trim();
  if (!name) return null;
  const description = form.description.trim();
  const active = form.active;
  if (variant === 'bogo') {
    const bogoMenuItemId = form.bogoMenuItemId.trim();
    if (!bogoMenuItemId) return null;
    return { id, name, description, active, kind: 'bogo_menu_item', bogoMenuItemId };
  }
  if (variant === 'discount') {
    if (form.discountSubtype === 'percent_off') {
      const percent = Math.min(100, Math.max(0, Number.isFinite(form.percent) ? form.percent : 0));
      return { id, name, description, active, kind: 'percent_off', percent };
    }
    const fixedAmount = Math.max(0, Number.isFinite(form.fixedAmount) ? form.fixedAmount : 0);
    return { id, name, description, active, kind: 'fixed_off_order', fixedAmount };
  }
  const lines = normalizedPackageLines(form, menuOptions);
  if (!lines) return null;
  const bundlePrice = Number.isFinite(form.bundlePrice) && form.bundlePrice >= 0 ? form.bundlePrice : 0;
  return { id, name, description, active, kind: 'package_deal', lines, bundlePrice };
}

function variantFromPromotion(p: Promotion): DealSubTab {
  if (p.kind === 'bogo_menu_item') return 'bogo';
  if (p.kind === 'package_deal') return 'package';
  return 'discount';
}

export function DealsScreen() {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const promotions = state.promotions;
  const menuIds = useMemo(() => state.menu.map(m => m.id), [state.menu]);
  const menuOptions = useMemo(
    () => state.menu.map(m => ({ id: m.id, name: m.name, price: m.price })),
    [state.menu]
  );
  const menuBy = useMemo(() => Object.fromEntries(state.menu.map(m => [m.id, m])), [state.menu]);

  const [dealTab, setDealTab] = useState<DealSubTab>('bogo');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [modalVariant, setModalVariant] = useState<DealSubTab>('bogo');
  const [deleteTarget, setDeleteTarget] = useState<Promotion | null>(null);
  const [editTarget, setEditTarget] = useState<Promotion | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(menuIds));
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const tabFiltered = useMemo(
    () => promotions.filter(p => promotionInSubTab(p, dealTab)),
    [promotions, dealTab]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tabFiltered.filter(p => {
      if (statusFilter === 'Active' && !p.active) return false;
      if (statusFilter === 'Inactive' && p.active) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
      );
    });
  }, [tabFiltered, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, dealTab]);

  useEffect(() => {
    if (tabFiltered.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !tabFiltered.some(p => p.id === selectedId)) {
      setSelectedId(tabFiltered[0].id);
    }
  }, [tabFiltered, selectedId]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const selected = promotions.find(p => p.id === selectedId) ?? null;

  const openAdd = () => {
    setModalVariant(dealTab);
    setForm(emptyForm(menuIds));
    setEditTarget(null);
    setModal('add');
  };

  const openEdit = (p: Promotion) => {
    const v = variantFromPromotion(p);
    setModalVariant(v);
    setEditTarget(p);
    if (p.kind === 'percent_off') {
      setForm({
        ...emptyForm(menuIds),
        name: p.name,
        description: p.description,
        active: p.active,
        discountSubtype: 'percent_off',
        percent: p.percent,
      });
    } else if (p.kind === 'fixed_off_order') {
      setForm({
        ...emptyForm(menuIds),
        name: p.name,
        description: p.description,
        active: p.active,
        discountSubtype: 'fixed_off_order',
        fixedAmount: p.fixedAmount,
      });
    } else if (p.kind === 'bogo_menu_item') {
      setForm({
        ...emptyForm(menuIds),
        name: p.name,
        description: p.description,
        active: p.active,
        bogoMenuItemId: p.bogoMenuItemId,
      });
    } else {
      setForm({
        ...emptyForm(menuIds),
        name: p.name,
        description: p.description,
        active: p.active,
        packageLines: p.lines.map(l => ({ ...l })),
        bundlePrice: p.bundlePrice,
      });
    }
    setModal('edit');
  };

  const handleSave = () => {
    const id = modal === 'add' ? `PROMO-${crypto.randomUUID().slice(0, 8)}` : (editTarget?.id ?? `PROMO-${crypto.randomUUID().slice(0, 8)}`);
    const built = toPromotion(id, form, modalVariant, menuOptions);
    if (!built) return;
    actions.promotions.upsert(built);
    setSelectedId(built.id);
    setDealTab(variantFromPromotion(built));
    setModal(null);
    setEditTarget(null);
  };

  const activeCount = promotions.filter(p => p.active).length;

  const tabBtn = (id: DealSubTab, label: string, Icon: React.ElementType) => (
    <button
      key={id}
      type="button"
      onClick={() => setDealTab(id)}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
        dealTab === id
          ? 'bg-primary text-on-primary-container border-primary shadow-sm'
          : 'bg-surface-container-high text-on-surface-variant border-outline-variant hover:text-on-surface'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </button>
  );

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden border-r border-outline-variant">
        <div className="p-6 pb-4 border-b border-outline-variant">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-black font-headline text-on-surface">Deals & promotions</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                BOGO, discounts, and multi-item packages — {activeCount} active total
              </p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="px-4 py-2.5 bg-primary text-on-primary-container font-bold rounded-xl text-sm hover:brightness-105 shadow-md"
            >
              Add in this tab
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {tabBtn('bogo', 'Buy 1 Get 1 Free', Gift)}
            {tabBtn('discount', 'Discount offers', Percent)}
            {tabBtn('package', 'Package deals', Package)}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {(['All', 'Active', 'Inactive'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  statusFilter === s ? 'bg-primary text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search deals…"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-high border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {paginatedData.map((p, i) => (
              <motion.button
                key={p.id}
                type="button"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedId === p.id
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-surface-container-high border-outline-variant hover:bg-surface-bright'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <span className="inline-flex text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary/15 text-primary mb-1">
                        {dealSectionLabel(p)}
                      </span>
                      <p className="font-bold text-on-surface text-sm truncate">{p.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">{p.id}</p>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{p.description || '—'}</p>
                      {p.kind === 'package_deal' && (() => {
                        const list = p.lines.reduce((s, ln) => {
                          const mi = menuBy[ln.menuItemId];
                          return s + (mi?.price ?? 0) * ln.qty;
                        }, 0);
                        return (
                          <p className="text-[10px] text-on-surface-variant mt-1.5 font-medium">
                            Menu set <span className="text-on-surface">{formatMoney(list)}</span>
                            {' → '}
                            bundle <span className="text-primary">{formatMoney(p.bundlePrice)}</span>
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        p.active ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {p.active ? 'Active' : 'Off'}
                    </span>
                    <p className="text-xs font-semibold text-on-surface-variant mt-1">{kindLabel(p)}</p>
                  </div>
                </div>
              </motion.button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-10">No deals in this tab match your filters.</p>
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

      <div className="w-96 bg-surface-container-low flex flex-col shrink-0">
        <div className="p-5 border-b border-outline-variant">
          <h2 className="font-black font-headline text-on-surface text-lg">Detail</h2>
          <p className="text-xs text-on-surface-variant mt-0.5">Edit or remove the selected deal</p>
        </div>
        {selected ? (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div>
              <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Name</p>
              <p className="font-bold text-on-surface mt-1">{selected.name}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Deals tab</p>
              <p className="text-sm font-bold text-primary mt-1">{dealSectionLabel(selected)}</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">POS and receipts use this deal type; manage it under this section in Deals.</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Type</p>
              <div className="flex items-center gap-2 mt-2">
                {selected.kind === 'percent_off' && <Percent className="w-4 h-4 text-primary" />}
                {selected.kind === 'fixed_off_order' && <CircleDollarSign className="w-4 h-4 text-primary" />}
                {selected.kind === 'bogo_menu_item' && <Gift className="w-4 h-4 text-primary" />}
                {selected.kind === 'package_deal' && <Package className="w-4 h-4 text-primary" />}
                <span className="text-sm font-semibold text-on-surface">{kindLabel(selected)}</span>
              </div>
              {selected.kind === 'percent_off' && (
                <p className="text-sm text-on-surface-variant mt-1">{selected.percent}% off list subtotal</p>
              )}
              {selected.kind === 'fixed_off_order' && (
                <p className="text-sm text-on-surface-variant mt-1">{formatMoney(selected.fixedAmount)} off list subtotal</p>
              )}
              {selected.kind === 'bogo_menu_item' && (
                <p className="text-sm text-on-surface-variant mt-1">
                  Menu item:{' '}
                  <span className="font-mono text-on-surface">{menuBy[selected.bogoMenuItemId]?.name ?? selected.bogoMenuItemId}</span>
                </p>
              )}
              {selected.kind === 'package_deal' && (() => {
                const rows = selected.lines.map(ln => {
                  const mi = menuBy[ln.menuItemId];
                  const unit = mi?.price ?? 0;
                  const ext = unit * ln.qty;
                  return { ln, label: mi?.name ?? ln.menuItemId, unit, ext };
                });
                const listTotal = rows.reduce((s, r) => s + r.ext, 0);
                const save = listTotal - selected.bundlePrice;
                return (
                  <div className="text-sm text-on-surface-variant mt-2 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant">Menu prices (current)</p>
                    <ul className="space-y-1.5 border border-outline-variant rounded-xl p-3 bg-surface-container-high/60">
                      {rows.map((r, idx) => (
                        <li key={idx} className="flex justify-between gap-2 text-xs">
                          <span className="text-on-surface min-w-0 truncate">
                            {r.label} <span className="text-on-surface-variant">×{r.ln.qty}</span>
                          </span>
                          <span className="shrink-0 font-mono text-on-surface">
                            {formatMoney(r.unit)} → {formatMoney(r.ext)}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="rounded-xl border border-outline-variant bg-surface-container-high p-3 text-xs space-y-1">
                      <div className="flex justify-between font-bold text-on-surface">
                        <span>List total (one set)</span>
                        <span>{formatMoney(listTotal)}</span>
                      </div>
                      <div className="flex justify-between text-on-surface-variant">
                        <span>Bundle price (one set)</span>
                        <span className="font-semibold text-primary">{formatMoney(selected.bundlePrice)}</span>
                      </div>
                      {save > 0.005 && (
                        <div className="flex justify-between text-secondary font-bold pt-1 border-t border-outline-variant">
                          <span>Savings vs menu</span>
                          <span>−{formatMoney(save)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-on-surface-variant tracking-widest">Description</p>
              <p className="text-sm text-on-surface mt-1 whitespace-pre-wrap">{selected.description || '—'}</p>
            </div>
            <div className="pt-4 border-t border-outline-variant space-y-2">
              <button
                type="button"
                onClick={() => openEdit(selected)}
                className="w-full py-2.5 bg-primary text-on-primary-container font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:brightness-105"
              >
                <Pencil className="w-4 h-4" /> Edit deal
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(selected)}
                className="w-full py-2.5 bg-surface-container-high border border-outline-variant text-error font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-error/10"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-on-surface-variant text-sm">
            <ChevronRight className="w-8 h-8 mb-2 opacity-40" />
            Select a deal from the list
          </div>
        )}
      </div>

      <AnimatePresence>
        {modal && (
          <PromotionModal
            title={modal === 'add' ? 'New deal' : 'Edit deal'}
            variant={modalVariant}
            onClose={() => { setModal(null); setEditTarget(null); }}
            onSave={handleSave}
            form={form}
            setForm={setForm}
            menuOptions={menuOptions}
            formatMoney={formatMoney}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
            onConfirm={() => {
              actions.promotions.remove(deleteTarget.id);
              setDeleteTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
