import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, XCircle, CheckCircle2, Plus, TrendingDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { CategorySelectField } from '../molecules/CategorySelectField';
import { Badge } from '../atoms/Badge';
import { SearchBar } from '../molecules/SearchBar';
import { StatCard } from '../molecules/StatCard';
import { CollapsibleStatsPanel } from '../molecules/CollapsibleStatsPanel';
import { FormField } from '../molecules/FormField';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { Pagination } from '../molecules/Pagination';
import { ModalShell } from '../organisms/ModalShell';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { PageHeader } from '../organisms/PageHeader';
import { PageScroll } from '../templates/PageScroll';
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import type { InventoryItem } from '../../lib/pos/types';
import type { Unit } from '../../lib/pos/units';
import type { DishCategory } from '../../lib/pos/constants';
import { useInventoryCategories, useDishCategories } from '../../hooks/useCategoryList';
const UNITS: Unit[] = ['kg', 'g', 'L', 'ml', 'pcs'];

function getStatus(stock: number, min: number) {
  if (stock === 0) return 'out';
  if (stock < min) return 'low';
  return 'ok';
}

const statusCfg = {
  ok:  { variant: 'success' as const, label: 'In Stock',     icon: CheckCircle2 },
  low: { variant: 'warning' as const, label: 'Low Stock',    icon: AlertTriangle },
  out: { variant: 'error' as const,   label: 'Out of Stock', icon: XCircle },
};

function ItemModal({ title, form, setForm, onClose, onSave, stockCategories, dishCategories, onAddStockCategory, onAddDishCategory }: {
  title: string;
  form: Omit<InventoryItem, 'id'>;
  setForm: (f: Omit<InventoryItem, 'id'>) => void;
  onClose: () => void;
  onSave: () => void;
  stockCategories: string[];
  dishCategories: string[];
  onAddStockCategory: (name: string) => { ok: true; name: string } | { ok: false; reason: string };
  onAddDishCategory: (name: string) => { ok: true; name: string } | { ok: false; reason: string };
}) {
  const { currency } = useAppSettings();
  const f = (field: keyof typeof form, val: string | number) => setForm({ ...form, [field]: val } as any);
  return (
    <ModalShell title={title} onClose={onClose} onSave={onSave} saveLabel="Save Item" saveDisabled={!form.name.trim()}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Item Name" required className="col-span-2">
          <Input value={form.name} onChange={(v) => f('name', v)} placeholder="e.g. Wagyu Beef" fullWidth />
        </FormField>
        <FormField label="Category">
          <CategorySelectField
            value={form.category}
            onChange={(v) => f('category', v)}
            categories={stockCategories}
            onAddCategory={onAddStockCategory}
            fullWidth
            addModalTitle="Add stock category"
          />
        </FormField>
        <FormField label="Dish Category">
          <CategorySelectField
            value={form.dishCategory}
            onChange={(v) => f('dishCategory', v as DishCategory)}
            categories={dishCategories}
            onAddCategory={onAddDishCategory}
            fullWidth
            addModalTitle="Add dish category"
          />
        </FormField>
        <FormField label="Dish Name (optional)" className="col-span-2">
          <Input value={form.dishName} onChange={(v) => f('dishName', v)} placeholder="e.g. Chicken Pizza / Zinger Burger" fullWidth />
        </FormField>
        <FormField label="Unit">
          <Select value={form.unit} onChange={(v) => f('unit', v as Unit)} options={UNITS} fullWidth />
        </FormField>
        <FormField label="Current Stock">
          <Input type="number" min="0" step="0.1" value={form.quantity || ''} onChange={(v) => f('quantity', parseFloat(v) || 0)} placeholder="0" fullWidth />
        </FormField>
        <FormField label="Min Level">
          <Input type="number" min="0" step="0.1" value={form.minLevel || ''} onChange={(v) => f('minLevel', parseFloat(v) || 0)} placeholder="0" fullWidth />
        </FormField>
        <FormField label={`Unit Cost (${currency})`}>
          <Input type="number" min="0" step="0.0001" value={form.costPerUnit || ''} onChange={(v) => f('costPerUnit', parseFloat(v) || 0)} placeholder="0.00" fullWidth />
        </FormField>
        <FormField label="Expiry Date" hint="Leave empty if no expiry" className="col-span-2">
          <Input type="date" value={form.expiryDate ?? ''} onChange={(v) => setForm({ ...form, expiryDate: v || undefined })} fullWidth />
        </FormField>
      </div>
    </ModalShell>
  );
}

export function InventoryScreen() {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const items = state.inventory;
  const { categories: stockCategories, addCategory: addStockCategory } = useInventoryCategories(items);
  const { categories: dishCategories, addCategory: addDishCategory } = useDishCategories(state.recipes, items);
  const defaultStockCategory = stockCategories[0] ?? 'Dry Goods';
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<Omit<InventoryItem, 'id'>>({ name: '', category: defaultStockCategory, dishCategory: 'General', dishName: '', quantity: 0, unit: 'g', costPerUnit: 0, minLevel: 0, expiryDate: undefined });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = items.filter(i =>
    (category === 'All' || i.category === category) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setCurrentPage(1); }, [search, category]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const okCount = items.filter(i => getStatus(i.quantity, i.minLevel) === 'ok').length;
  const lowCount = items.filter(i => getStatus(i.quantity, i.minLevel) === 'low').length;
  const outCount = items.filter(i => getStatus(i.quantity, i.minLevel) === 'out').length;

  const openAdd = () => { setForm({ name: '', category: defaultStockCategory, dishCategory: 'General', dishName: '', quantity: 0, unit: 'g', costPerUnit: 0, minLevel: 0, expiryDate: undefined }); setModal('add'); };
  const openEdit = (item: InventoryItem) => {
    setEditTarget(item);
    setForm({ name: item.name, category: item.category, dishCategory: item.dishCategory, dishName: item.dishName, quantity: item.quantity, unit: item.unit, costPerUnit: item.costPerUnit, minLevel: item.minLevel, expiryDate: item.expiryDate });
    setModal('edit');
  };

  const handleSave = () => {
    const normalized: InventoryItem = {
      id: modal === 'add' ? `INV-${crypto.randomUUID()}` : (editTarget?.id ?? `INV-${crypto.randomUUID()}`),
      name: form.name.trim(), category: form.category, dishCategory: form.dishCategory,
      dishName: (form.dishName ?? '').trim(), quantity: Math.max(0, Number(form.quantity) || 0),
      unit: form.unit, costPerUnit: Math.max(0, Number(form.costPerUnit) || 0), minLevel: Math.max(0, Number(form.minLevel) || 0),
      expiryDate: form.expiryDate || undefined,
    };
    if (modal === 'add') actions.inventory.upsert(normalized);
    else if (modal === 'edit' && editTarget) actions.inventory.upsert({ ...normalized, id: editTarget.id });
    setModal(null);
  };

  const handleDelete = () => {
    if (deleteTarget) actions.inventory.remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <PageScroll className="p-4 sm:p-6 space-y-5">
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels, costs and suppliers."
        actions={<Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>Add Item</Button>}
      />

      <CollapsibleStatsPanel
        title="Stock overview"
        storageKey="pos-stats-inventory"
        gridClassName="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <StatCard label="In Stock" value={okCount} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Low Stock" value={lowCount} icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="Out of Stock" value={outCount} icon={<XCircle className="w-4 h-4" />} />
      </CollapsibleStatsPanel>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search items…" className="w-52" />
        <CategoryFilter
          categories={['All', ...stockCategories]}
          active={category}
          onChange={setCategory}
          onAddCategory={addStockCategory}
          addModalTitle="Add stock category"
        />
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-high text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
              <th className="px-5 py-3.5">Item</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Stock</th>
              <th className="px-5 py-3.5">Min Level</th>
              <th className="px-5 py-3.5">Unit Cost</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            <AnimatePresence>
              {paginatedData.map(item => {
                const st = getStatus(item.quantity, item.minLevel);
                const cfg = statusCfg[st];
                const Icon = cfg.icon;
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="hover:bg-surface-container-high transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">{item.id}</p>
                    </td>
                    <td className="px-5 py-3.5"><Badge variant="neutral">{item.category}</Badge></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${st === 'ok' ? 'text-on-surface' : st === 'low' ? 'text-tertiary' : 'text-error'}`}>{item.quantity}</span>
                        <span className="text-xs text-on-surface-variant">{item.unit}</span>
                        {st !== 'ok' && <TrendingDown className={`w-3.5 h-3.5 ${st === 'low' ? 'text-tertiary' : 'text-error'}`} />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">{item.minLevel} {item.unit}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-primary font-mono">
                      {formatMoney(item.costPerUnit, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={cfg.variant} icon={<Icon className="w-3 h-3" />}>{cfg.label}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="hover:text-primary hover:bg-primary/10">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(item)} className="hover:text-error hover:bg-error/10">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-on-surface-variant">No items match your search.</td></tr>
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
        )}
      </div>

      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <ItemModal
            title={modal === 'add' ? 'Add Inventory Item' : 'Edit Item'}
            form={form}
            setForm={setForm}
            onClose={() => setModal(null)}
            onSave={handleSave}
            stockCategories={stockCategories}
            dishCategories={dishCategories}
            onAddStockCategory={addStockCategory}
            onAddDishCategory={addDishCategory}
          />
        )}
        {deleteTarget && (
          <ConfirmDialog
            title="Delete Item"
            message={<>Remove <span className="font-semibold text-on-surface">"{deleteTarget.name}"</span> from inventory? This cannot be undone.</>}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </PageScroll>
  );
}
