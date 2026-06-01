import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, Pencil, Trash2, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import menuData from '../../mock/menu.json';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Badge } from '../atoms/Badge';
import { SearchBar } from '../molecules/SearchBar';
import { StatCard } from '../molecules/StatCard';
import { FormField } from '../molecules/FormField';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { Pagination } from '../molecules/Pagination';
import { ModalShell } from '../organisms/ModalShell';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { PageHeader } from '../organisms/PageHeader';
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import type { MenuItem } from '../../lib/pos/types';
import { menuItemAvailability } from '../../lib/pos/selectors';

const MENU_CATEGORIES: string[] = menuData.categories;

const statusCfg: Record<string, { variant: 'success' | 'warning' | 'error'; icon: React.ElementType; label: string }> = {
  in_stock:     { variant: 'success', icon: CheckCircle2, label: 'In Stock' },
  low_stock:    { variant: 'warning', icon: AlertTriangle, label: 'Low Stock' },
  out_of_stock: { variant: 'error',   icon: XCircle,       label: 'Out of Stock' },
};

function MenuFormModal({ title, onClose, onSave, form, setForm, recipeOptions }: {
  title: string; onClose: () => void; onSave: () => void;
  form: Omit<MenuItem, 'id'>; setForm: (f: Omit<MenuItem, 'id'>) => void;
  recipeOptions: Array<{ value: string; label: string }>;
}) {
  const { currency } = useAppSettings();
  return (
    <ModalShell title={title} onClose={onClose} onSave={onSave} saveLabel="Save Item" saveDisabled={!form.name.trim()}>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Item Name" required className="col-span-2">
          <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Wagyu Burger" fullWidth />
        </FormField>
        <FormField label="Category">
          <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={MENU_CATEGORIES} fullWidth />
        </FormField>
        <FormField label={`Price (${currency})`}>
          <Input type="number" min="0" step="0.01" value={form.price || ''} onChange={(v) => setForm({ ...form, price: parseFloat(v) || 0 })} placeholder="0.00" fullWidth />
        </FormField>
        <FormField label="Recipe" required>
          <Select value={form.recipeId} onChange={(v) => setForm({ ...form, recipeId: v })} options={recipeOptions} fullWidth />
        </FormField>
        <FormField label="Image URL">
          <Input value={form.image} onChange={(v) => setForm({ ...form, image: v })} placeholder="https://..." fullWidth />
        </FormField>
      </div>
    </ModalShell>
  );
}

export function MenuScreen() {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const items = state.menu;
  const recipes = state.recipes;
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [editTarget, setEditTarget] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<Omit<MenuItem, 'id'>>({ name: '', category: 'Main Course', price: 0, recipeId: recipes[0]?.id ?? '', image: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = items.filter(i =>
    (catFilter === 'All' || i.category === catFilter) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => { setCurrentPage(1); }, [search, catFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const recipeOptions = recipes.map(r => ({ value: r.id, label: r.name }));
  const openAdd = () => { setForm({ name: '', category: 'Main Course', price: 0, recipeId: recipes[0]?.id ?? '', image: '' }); setModal('add'); };
  const openEdit = (item: MenuItem) => { setEditTarget(item); setForm({ name: item.name, category: item.category, price: item.price, recipeId: item.recipeId, image: item.image ?? '' }); setModal('edit'); };

  const handleSave = () => {
    if (modal === 'add') {
      actions.menu.upsert({ id: `MENU-${crypto.randomUUID()}`, ...form, name: form.name.trim() });
    } else if (modal === 'edit' && editTarget) {
      actions.menu.upsert({ id: editTarget.id, ...form, name: form.name.trim() });
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (deleteTarget) actions.menu.remove(deleteTarget.id);
    setDeleteTarget(null);
  };

  const inStock = items.filter(i => menuItemAvailability(state, i) === 'in_stock').length;
  const lowStock = items.filter(i => menuItemAvailability(state, i) === 'low_stock').length;
  const outStock = items.filter(i => menuItemAvailability(state, i) === 'out_of_stock').length;

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto min-h-full">
      <PageHeader
        title="Menu Management"
        subtitle={`${items.length} items · manage availability, pricing and ingredients`}
        actions={
          <Button onClick={openAdd} icon={<Plus className="w-4 h-4" />}>Add New Item</Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="In Stock" value={inStock} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="Low Stock" value={lowStock} icon={<AlertTriangle className="w-4 h-4" />} />
        <StatCard label="Out of Stock" value={outStock} icon={<XCircle className="w-4 h-4" />} />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search items…" className="w-52" />
        <CategoryFilter categories={['All', ...MENU_CATEGORIES]} active={catFilter} onChange={setCatFilter} />
      </div>

      <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[700px]">
          <thead>
            <tr className="bg-surface-container-high text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
              <th className="px-5 py-3.5">Item</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Price</th>
              <th className="px-5 py-3.5">Recipe</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            <AnimatePresence>
              {paginatedData.map((item) => {
                const avail = menuItemAvailability(state, item);
                const cfg = statusCfg[avail];
                const Icon = cfg.icon;
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}
                    className="hover:bg-surface-container-high transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface-container-high shrink-0">
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-xs font-bold">{item.name[0]}</div>}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant="neutral">{item.category}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-primary text-sm">{formatMoney(item.price)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-on-surface-variant">
                        {state.recipes.find(r => r.id === item.recipeId)?.name ?? '—'}
                      </span>
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
              <tr><td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant text-sm">No items match your search.</td></tr>
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
        )}
      </div>

      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <MenuFormModal title={modal === 'add' ? 'Add New Item' : 'Edit Item'} onClose={() => setModal(null)} onSave={handleSave} form={form} setForm={setForm} recipeOptions={recipeOptions} />
        )}
        {deleteTarget && (
          <ConfirmDialog
            title="Delete Item"
            message={<>Are you sure you want to delete <span className="font-semibold text-on-surface">"{deleteTarget.name}"</span>? This cannot be undone.</>}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
