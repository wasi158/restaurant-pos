import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, X, Search, AlertTriangle, XCircle, CheckCircle2 } from 'lucide-react';
import { MENU_CATEGORIES } from '../data/mockMenu';
import { Pagination } from './Pagination';
import { usePos } from '../lib/pos/store';
import { useAppSettings } from '../lib/appSettings';
import type { MenuItem } from '../lib/pos/types';
import { menuItemAvailability } from '../lib/pos/selectors';


const statusCfg: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  in_stock:     { color: 'text-secondary', bg: 'bg-secondary/10', icon: CheckCircle2, label: 'In Stock' },
  low_stock:    { color: 'text-tertiary',  bg: 'bg-tertiary/10',  icon: AlertTriangle, label: 'Low Stock' },
  out_of_stock: { color: 'text-error',     bg: 'bg-error/10',     icon: XCircle, label: 'Out of Stock' },
};

function Modal({ title, onClose, onSave, form, setForm, recipeOptions }: {
  title: string; onClose: () => void; onSave: () => void;
  form: Omit<MenuItem, 'id'>; setForm: (f: Omit<MenuItem, 'id'>) => void;
  recipeOptions: Array<{ id: string; name: string }>;
}) {
  const { currency } = useAppSettings();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl z-10">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <h2 className="font-bold font-headline text-on-surface text-lg">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Item Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Wagyu Burger"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                {MENU_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Price ({currency})</label>
              <input type="number" min="0" step="0.01" value={form.price || ''} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Recipe *</label>
              <select value={form.recipeId} onChange={e => setForm({ ...form, recipeId: e.target.value })}
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                {recipeOptions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Image URL</label>
              <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })}
                placeholder="https://..."
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-outline-variant">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">Cancel</button>
          <button onClick={onSave} disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
            Save Item
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function DeleteConfirm({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-surface-container-low border border-outline-variant rounded-2xl w-full max-w-sm shadow-2xl z-10 p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-5 h-5 text-error" />
        </div>
        <h3 className="font-bold font-headline text-on-surface text-lg mb-1">Delete Item</h3>
        <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to delete <span className="font-semibold text-on-surface">"{name}"</span>? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-error text-white font-semibold rounded-xl hover:brightness-105 transition-all text-sm">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

export function MenuScreen() {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const items = state.menu;
  const recipes = state.recipes;
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [modal, setModal]         = useState<'add' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);
  const [editTarget, setEditTarget]     = useState<MenuItem | null>(null);
  const [form, setForm]           = useState<Omit<MenuItem, 'id'>>({ name: '', category: 'Main Course', price: 0, recipeId: recipes[0]?.id ?? '', image: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = items.filter(i =>
    (catFilter === 'All' || i.category === catFilter) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, catFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const recipeOptions = recipes.map(r => ({ id: r.id, name: r.name }));
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

  const inStock  = items.filter(i => menuItemAvailability(state, i) === 'in_stock').length;
  const lowStock = items.filter(i => menuItemAvailability(state, i) === 'low_stock').length;
  const outStock = items.filter(i => menuItemAvailability(state, i) === 'out_of_stock').length;

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface">Menu Management</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">{items.length} items · manage availability, pricing and ingredients</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all text-sm shadow-md">
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Stock',     value: inStock,  icon: CheckCircle2, color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Low Stock',    value: lowStock, icon: AlertTriangle, color: 'text-tertiary',  bg: 'bg-tertiary/10'  },
          { label: 'Out of Stock', value: outStock, icon: XCircle,       color: 'text-error',     bg: 'bg-error/10'     },
        ].map((s, i) => (
          <div key={i} className="bg-surface-container-high rounded-2xl p-4 border border-outline-variant flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div>
              <p className="text-xl font-bold font-headline text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
            className="bg-surface-container-high border border-outline-variant rounded-xl py-2 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 w-52" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', ...MENU_CATEGORIES].map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${catFilter === c ? 'bg-primary text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
        <table className="w-full text-left">
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
                      <span className="text-xs bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full font-medium">{item.category}</span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-primary text-sm">{formatMoney(item.price)}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-on-surface-variant">
                        {state.recipes.find(r => r.id === item.recipeId)?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-on-surface-variant text-sm border-b-transparent">No items match your search.</td></tr>
            )}
          </tbody>
        </table>
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

      {/* Modals */}
      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <Modal title={modal === 'add' ? 'Add New Item' : 'Edit Item'} onClose={() => setModal(null)} onSave={handleSave} form={form} setForm={setForm} recipeOptions={recipeOptions} />
        )}
        {deleteTarget && (
          <DeleteConfirm name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        )}
      </AnimatePresence>
    </div>
  );
}
