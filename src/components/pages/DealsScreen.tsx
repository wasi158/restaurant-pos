import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Tag,
  Pencil,
  Trash2,
  ChevronRight,
  Percent,
  CircleDollarSign,
  Gift,
  Package,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Toggle } from '../atoms/Toggle';
import { Badge } from '../atoms/Badge';
import { SearchBar } from '../molecules/SearchBar';
import { FormField } from '../molecules/FormField';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { Pagination } from '../molecules/Pagination';
import { ModalShell } from '../organisms/ModalShell';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { PageHeader } from '../organisms/PageHeader';
import { usePos } from '../../lib/pos/store';
import type { Promotion } from '../../lib/pos/types';
import { useAppSettings } from '../../lib/appSettings';

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
    return 'Pick 3 or 4 different menu items (use "Add fourth item" if needed).';
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
    <ModalShell
      title={title}
      onClose={onClose}
      onSave={onSave}
      saveLabel="Save deal"
      saveDisabled={!canSave}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-primary -mt-2 mb-4">
        {variant === 'bogo' && 'Tab: Buy 1 Get 1 Free'}
        {variant === 'discount' && 'Tab: Discount offers'}
        {variant === 'package' && 'Tab: Package deals'}
      </p>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        <FormField label="Deal name" required>
          <Input
            value={form.name}
            onChange={val => f({ name: val })}
            placeholder="e.g. Weekend combo"
            fullWidth
          />
        </FormField>
        <FormField label="Description">
          <textarea
            value={form.description}
            onChange={e => f({ description: e.target.value })}
            placeholder="Shown to staff on POS / receipts"
            rows={2}
            className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </FormField>

        {variant === 'bogo' && (
          <FormField label="Menu item (BOGO applies here)">
            <Select
              value={form.bogoMenuItemId}
              onChange={val => f({ bogoMenuItemId: val })}
              options={[
                { value: '', label: 'Select menu item…' },
                ...menuOptions.map(m => ({ value: m.id, label: m.name })),
              ]}
              fullWidth
            />
          </FormField>
        )}

        {variant === 'discount' && (
          <>
            <FormField label="Discount type">
              <Select
                value={form.discountSubtype}
                onChange={val => f({ discountSubtype: val as DiscountSubtype })}
                options={[
                  { value: 'percent_off', label: 'Percent off entire order' },
                  { value: 'fixed_off_order', label: 'Fixed amount off list subtotal' },
                ]}
                fullWidth
              />
            </FormField>
            {form.discountSubtype === 'percent_off' && (
              <FormField label="Percent off (0–100)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={Number.isFinite(form.percent) ? form.percent : 0}
                  onChange={val => {
                    const n = parseFloat(val);
                    f({ percent: Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0 });
                  }}
                  fullWidth
                />
              </FormField>
            )}
            {form.discountSubtype === 'fixed_off_order' && (
              <FormField label="Amount off (order currency)">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={Number.isFinite(form.fixedAmount) ? form.fixedAmount : 0}
                  onChange={val => f({ fixedAmount: parseNonNegativeMoney(val, form.fixedAmount) })}
                  fullWidth
                />
              </FormField>
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
                        <FormField label={`Item ${index + 1}`}>
                          <Select
                            value={row.menuItemId}
                            onChange={val => setPackageLine(index, { menuItemId: val })}
                            options={[
                              { value: '', label: 'Select…' },
                              ...menuOptions.map(opt => ({
                                value: opt.id,
                                label: `${opt.name} (${formatMoney(opt.price)})`,
                              })),
                            ]}
                            fullWidth
                          />
                        </FormField>
                      </div>
                      <div className="w-20 shrink-0">
                        <FormField label="Qty">
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            value={row.qty}
                            onChange={val => setPackageLine(index, { qty: Math.max(1, Math.floor(Number(val) || 1)) })}
                            fullWidth
                            className="text-center"
                          />
                        </FormField>
                      </div>
                      {form.packageLines.length > 3 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          icon={<Trash2 className="w-4 h-4" />}
                          onClick={() => removePackageRow(index)}
                          className="shrink-0 mb-0.5 text-error hover:bg-error/10"
                          title="Remove line"
                        />
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
              <Button
                variant="ghost"
                size="sm"
                onClick={addPackageRow}
                className="text-primary font-bold"
              >
                + Add fourth item (optional)
              </Button>
            )}
            <FormField label="Bundle price per complete set" hint={`Customer pays ${formatMoney(bundlePriceSafe)} per complete bundle when all lines are in the cart.`}>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={Number.isFinite(form.bundlePrice) ? form.bundlePrice : 0}
                onChange={val => f({ bundlePrice: parseNonNegativeMoney(val, form.bundlePrice) })}
                fullWidth
              />
            </FormField>
          </>
        )}

        <FormField label="Active (selectable on POS)" horizontal>
          <Toggle value={form.active} onChange={v => f({ active: v })} />
        </FormField>
      </div>
    </ModalShell>
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
    <Button
      key={id}
      variant={dealTab === id ? 'primary' : 'secondary'}
      size="sm"
      icon={<Icon className="w-3.5 h-3.5" />}
      onClick={() => setDealTab(id)}
    >
      {label}
    </Button>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-full overflow-x-hidden">
      <div className="flex-1 flex flex-col overflow-hidden lg:border-r border-outline-variant">
        <div className="p-6 pb-4 border-b border-outline-variant">
          <PageHeader
            title="Deals & promotions"
            subtitle={`BOGO, discounts, and multi-item packages — ${activeCount} active total`}
            actions={
              <Button variant="primary" onClick={openAdd}>Add in this tab</Button>
            }
          />

          <div className="flex flex-wrap gap-2 mt-4">
            {tabBtn('bogo', 'Buy 1 Get 1 Free', Gift)}
            {tabBtn('discount', 'Discount offers', Percent)}
            {tabBtn('package', 'Package deals', Package)}
          </div>

          <CategoryFilter
            categories={['All', 'Active', 'Inactive']}
            active={statusFilter}
            onChange={s => setStatusFilter(s as 'All' | 'Active' | 'Inactive')}
            className="mt-3"
          />

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search deals…"
            className="mt-4"
          />
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
                      <Badge variant="info">{dealSectionLabel(p)}</Badge>
                      <p className="font-bold text-on-surface text-sm truncate mt-1">{p.name}</p>
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
                    <Badge variant={p.active ? 'success' : 'neutral'}>
                      {p.active ? 'Active' : 'Off'}
                    </Badge>
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

      <div className="w-full lg:w-96 bg-surface-container-low flex flex-col shrink-0">
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
              <Button
                variant="primary"
                icon={<Pencil className="w-4 h-4" />}
                onClick={() => openEdit(selected)}
                className="w-full justify-center"
              >
                Edit deal
              </Button>
              <Button
                variant="secondary"
                icon={<Trash2 className="w-4 h-4" />}
                onClick={() => setDeleteTarget(selected)}
                className="w-full justify-center text-error hover:bg-error/10"
              >
                Remove
              </Button>
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
          <ConfirmDialog
            title="Remove deal"
            message={<>Remove <span className="font-semibold text-on-surface">{`"${deleteTarget.name}"`}</span>?</>}
            confirmLabel="Remove"
            onConfirm={() => {
              actions.promotions.remove(deleteTarget.id);
              setDeleteTarget(null);
            }}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
