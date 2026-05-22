import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, XCircle, CheckCircle2, Plus, Search, TrendingDown, Pencil, Trash2, X } from 'lucide-react';
import { CATEGORIES } from '../data/mockInventory';
import { Pagination } from './Pagination';
import { usePos } from '../lib/pos/store';
import { useAppSettings } from '../lib/appSettings';
import type { InventoryItem } from '../lib/pos/types';
import type { Unit } from '../lib/pos/units';
import { DISH_CATEGORIES, type DishCategory } from '../lib/pos/constants';


function getStatus(stock: number, min: number) {
  if (stock === 0) return 'out';
  if (stock < min) return 'low';
  return 'ok';
}

const statusCfg = {
  ok:  { label: 'In Stock',     color: 'text-secondary', bg: 'bg-secondary/10', icon: CheckCircle2  },
  low: { label: 'Low Stock',    color: 'text-tertiary',  bg: 'bg-tertiary/10',  icon: AlertTriangle },
  out: { label: 'Out of Stock', color: 'text-error',     bg: 'bg-error/10',     icon: XCircle       },
};

const UNITS: Unit[] = ['kg', 'g', 'L', 'ml', 'pcs'];

function ItemModal({ title, form, setForm, onClose, onSave }: {
  title: string;
  form: Omit<InventoryItem, 'id'>;
  setForm: (f: Omit<InventoryItem, 'id'>) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const { currency } = useAppSettings();
  const f = (field: keyof typeof form, val: string | number) => setForm({ ...form, [field]: val } as any);
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
        <div className="p-5 grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Item Name *</label>
            <input value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Wagyu Beef"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Category</label>
            <select value={form.category} onChange={e => f('category', e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Dish Category</label>
            <select value={form.dishCategory} onChange={e => f('dishCategory', e.target.value as DishCategory)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
              {DISH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Dish Name (optional)</label>
            <input value={form.dishName} onChange={e => f('dishName', e.target.value)}
              placeholder="e.g. Chicken Pizza / Zinger Burger"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Unit</label>
            <select value={form.unit} onChange={e => f('unit', e.target.value as Unit)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
              {UNITS.map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Current Stock</label>
            <input type="number" min="0" step="0.1" value={form.quantity || ''} onChange={e => f('quantity', parseFloat(e.target.value) || 0)} placeholder="0"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Min Level</label>
            <input type="number" min="0" step="0.1" value={form.minLevel || ''} onChange={e => f('minLevel', parseFloat(e.target.value) || 0)} placeholder="0"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Unit cost ({currency})</label>
            <input type="number" min="0" step="0.0001" value={form.costPerUnit || ''} onChange={e => f('costPerUnit', parseFloat(e.target.value) || 0)} placeholder="0.00"
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
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
        <p className="text-sm text-on-surface-variant mb-6">Remove <span className="font-semibold text-on-surface">"{name}"</span> from inventory? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-error text-white font-semibold rounded-xl hover:brightness-105 transition-all text-sm">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

export function InventoryScreen() {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const items = state.inventory;
  const [category, setCategory]         = useState('All');
  const [search, setSearch]             = useState('');
  const [modal, setModal]               = useState<'add' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [editTarget, setEditTarget]     = useState<InventoryItem | null>(null);
  const [form, setForm]                 = useState<Omit<InventoryItem, 'id'>>({ name: '', category: CATEGORIES[0] ?? 'Dry Goods', dishCategory: 'General', dishName: '', quantity: 0, unit: 'g', costPerUnit: 0, minLevel: 0 });
  const [currentPage, setCurrentPage]   = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = items.filter(i =>
    (category === 'All' || i.category === category) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const okCount  = items.filter(i => getStatus(i.quantity, i.minLevel) === 'ok').length;
  const lowCount = items.filter(i => getStatus(i.quantity, i.minLevel) === 'low').length;
  const outCount = items.filter(i => getStatus(i.quantity, i.minLevel) === 'out').length;

  const openAdd = () => { setForm({ name: '', category: CATEGORIES[0] ?? 'Dry Goods', dishCategory: 'General', dishName: '', quantity: 0, unit: 'g', costPerUnit: 0, minLevel: 0 }); setModal('add'); };
  const openEdit = (item: InventoryItem) => {
    setEditTarget(item);
    setForm({ name: item.name, category: item.category, dishCategory: item.dishCategory, dishName: item.dishName, quantity: item.quantity, unit: item.unit, costPerUnit: item.costPerUnit, minLevel: item.minLevel });
    setModal('edit');
  };

  const handleSave = () => {
    const normalized: InventoryItem = {
      id: modal === 'add' ? `INV-${crypto.randomUUID()}` : (editTarget?.id ?? `INV-${crypto.randomUUID()}`),
      name: form.name.trim(),
      category: form.category,
      dishCategory: form.dishCategory,
      dishName: (form.dishName ?? '').trim(),
      quantity: Math.max(0, Number(form.quantity) || 0),
      unit: form.unit,
      costPerUnit: Math.max(0, Number(form.costPerUnit) || 0),
      minLevel: Math.max(0, Number(form.minLevel) || 0),
    };
    if (modal === 'add') {
      actions.inventory.upsert(normalized);
    } else if (modal === 'edit' && editTarget) {
      actions.inventory.upsert({ ...normalized, id: editTarget.id });
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (deleteTarget) actions.inventory.remove(deleteTarget.id); // blocked if used by any recipe
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface">Inventory</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Track stock levels, costs and suppliers.</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all text-sm shadow-md">
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'In Stock',     value: okCount,  icon: CheckCircle2,  color: 'text-secondary', bg: 'bg-secondary/10' },
          { label: 'Low Stock',    value: lowCount, icon: AlertTriangle, color: 'text-tertiary',  bg: 'bg-tertiary/10'  },
          { label: 'Out of Stock', value: outCount, icon: XCircle,       color: 'text-error',     bg: 'bg-error/10'     },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
            <div>
              <p className="text-2xl font-bold font-headline text-on-surface">{s.value}</p>
              <p className="text-xs text-on-surface-variant">{s.label}</p>
            </div>
          </motion.div>
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
          {['All', ...CATEGORIES].map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${category === c ? 'bg-primary text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
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
                const st  = getStatus(item.quantity, item.minLevel);
                const cfg = statusCfg[st];
                const Icon = cfg.icon;
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="hover:bg-surface-container-high transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                      <p className="text-[10px] text-on-surface-variant font-mono">{item.id}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs bg-surface-container-highest text-on-surface-variant px-2.5 py-1 rounded-full font-medium">{item.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-sm font-bold ${st === 'ok' ? 'text-on-surface' : cfg.color}`}>{item.quantity}</span>
                        <span className="text-xs text-on-surface-variant">{item.unit}</span>
                        {st !== 'ok' && <TrendingDown className={`w-3.5 h-3.5 ${cfg.color}`} />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-on-surface-variant">{item.minLevel} {item.unit}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-primary font-mono">
                      {formatMoney(item.costPerUnit, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
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
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-on-surface-variant border-b-transparent">No items match your search.</td></tr>
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

      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <ItemModal title={modal === 'add' ? 'Add Inventory Item' : 'Edit Item'} form={form} setForm={setForm} onClose={() => setModal(null)} onSave={handleSave} />
        )}
        {deleteTarget && (
          <DeleteConfirm name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        )}
      </AnimatePresence>
    </div>
  );
}
