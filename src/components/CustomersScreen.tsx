import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Crown, Star, UserCircle, TrendingUp, Calendar, DollarSign, ChevronRight, UserPlus, Pencil, Trash2, X, Phone, Mail } from 'lucide-react';
import { Customer, Tier, TIERS, INITIAL_CUSTOMERS, BLANK_CUSTOMER } from '../data/mockCustomers';
import { Pagination } from './Pagination';
import { useAppSettings } from '../lib/appSettings';

const tierCfg: Record<Tier, { color: string; bg: string; icon: React.ElementType }> = {
  VIP:     { color: 'text-primary',   bg: 'bg-primary/10',   icon: Crown      },
  Regular: { color: 'text-secondary', bg: 'bg-secondary/10', icon: Star       },
  New:     { color: 'text-tertiary',  bg: 'bg-tertiary/10',  icon: UserCircle },
};


function CustomerModal({ title, onClose, onSave, form, setForm }: {
  title: string; onClose: () => void; onSave: () => void;
  form: Omit<Customer, 'id'>; setForm: (f: Omit<Customer, 'id'>) => void;
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
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Full Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Jane Smith"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@email.com"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0000"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Tier</label>
              <select value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value as Tier })}
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                {TIERS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Favourite Item</label>
              <input value={form.fav} onChange={e => setForm({ ...form, fav: e.target.value })} placeholder="e.g. Wagyu Burger"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Total Visits</label>
              <input type="number" min="0" value={form.visits || ''} onChange={e => setForm({ ...form, visits: parseInt(e.target.value) || 0 })} placeholder="0"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Total spend ({currency})</label>
              <input type="number" min="0" value={form.spend || ''} onChange={e => setForm({ ...form, spend: parseFloat(e.target.value) || 0 })} placeholder="0.00"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-outline-variant">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">Cancel</button>
          <button onClick={onSave} disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
            Save Guest
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
        <h3 className="font-bold font-headline text-on-surface text-lg mb-1">Remove Guest</h3>
        <p className="text-sm text-on-surface-variant mb-6">Remove <span className="font-semibold text-on-surface">"{name}"</span> from the guest list?</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-error text-white font-semibold rounded-xl hover:brightness-105 transition-all text-sm">Remove</button>
        </div>
      </motion.div>
    </div>
  );
}

export function CustomersScreen() {
  const { formatMoney } = useAppSettings();
  const [customers, setCustomers]       = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [tierFilter, setTierFilter]     = useState<'All' | Tier>('All');
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState<Customer>(INITIAL_CUSTOMERS[0]);
  const [modal, setModal]               = useState<'add' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [form, setForm]                 = useState<Omit<Customer, 'id'>>(BLANK_CUSTOMER);
  const [currentPage, setCurrentPage]   = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = customers.filter(c =>
    (tierFilter === 'All' || c.tier === tierFilter) &&
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tierFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalSpend  = customers.reduce((s, c) => s + c.spend, 0);
  const totalVisits = customers.reduce((s, c) => s + c.visits, 0);
  const avgSpend    = customers.length ? totalSpend / customers.length : 0;

  const openAdd  = () => { setForm(BLANK_CUSTOMER); setModal('add'); };
  const openEdit = (c: Customer) => { setForm({ name: c.name, email: c.email, phone: c.phone, visits: c.visits, spend: c.spend, tier: c.tier, lastVisit: c.lastVisit, fav: c.fav }); setModal('edit'); };

  const handleSave = () => {
    if (modal === 'add') {
      const newId = `GST-${String(customers.length + 1).padStart(3, '0')}`;
      const newC  = { id: newId, ...form };
      setCustomers(prev => [newC, ...prev]);
      setSelected(newC);
    } else if (modal === 'edit') {
      setCustomers(prev => prev.map(c => c.id === selected.id ? { ...c, ...form } : c));
      setSelected(prev => ({ ...prev, ...form }));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setCustomers(prev => {
        const next = prev.filter(c => c.id !== deleteTarget.id);
        if (selected.id === deleteTarget.id && next.length) setSelected(next[0]);
        return next;
      });
    }
    setDeleteTarget(null);
  };

  const pts = Math.min((selected.spend * 0.1), 1000);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left */}
      <div className="flex-1 flex flex-col overflow-hidden border-r border-outline-variant">
        <div className="p-5 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold font-headline text-on-surface">Customers</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">{customers.length} guests on record</p>
            </div>
            <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-xs shadow-md">
              <UserPlus className="w-3.5 h-3.5" /> Add Guest
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total Spend',  value: formatMoney(totalSpend), icon: DollarSign },
              { label: 'Total Visits', value: totalVisits,                        icon: Calendar   },
              { label: 'Avg Spend',    value: formatMoney(avgSpend),          icon: TrendingUp },
            ].map((s, i) => (
              <div key={i} className="bg-surface-container-high rounded-xl p-3 border border-outline-variant flex items-center gap-2">
                <s.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-bold text-on-surface leading-none">{s.value}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search guests…"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-1.5 pl-8 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="flex gap-1">
              {(['All', ...TIERS] as const).map(t => (
                <button key={t} onClick={() => setTierFilter(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${tierFilter === t ? 'bg-primary text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <AnimatePresence>
              {paginatedData.map((c) => {
              const cfg  = tierCfg[c.tier];
              const Icon = cfg.icon;
              const initials = c.name.split(' ').map(n => n[0]).join('').slice(0, 2);
              return (
                <motion.button key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${selected.id === c.id ? 'bg-primary/10 border-primary/40' : 'bg-surface-container-high border-outline-variant hover:bg-surface-bright'}`}>
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-on-surface truncate">{c.name}</p>
                      <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${cfg.bg} ${cfg.color}`}>
                        <Icon className="w-2.5 h-2.5" />{c.tier}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">{c.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-primary">{formatMoney(c.spend)}</p>
                    <p className="text-[10px] text-on-surface-variant">{c.visits} visits</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                </motion.button>
              );
            })}
          </AnimatePresence>
            {filtered.length === 0 && <p className="text-center text-sm text-on-surface-variant py-10">No guests found.</p>}
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

      {/* Right — detail panel */}
      <div className="w-72 bg-surface-container-low flex flex-col shrink-0">
        <div className="p-5 border-b border-outline-variant">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h2 className="font-bold font-headline text-on-surface leading-none">{selected.name}</h2>
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${tierCfg[selected.tier].bg} ${tierCfg[selected.tier].color}`}>
                  {React.createElement(tierCfg[selected.tier].icon, { className: 'w-2.5 h-2.5' })}
                  {selected.tier} Member
                </span>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(selected)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setDeleteTarget(selected)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="bg-surface-container-high rounded-xl p-4 space-y-2.5 border border-outline-variant">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contact</p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <span className="text-on-surface truncate">{selected.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
              <span className="text-on-surface">{selected.phone || '—'}</span>
            </div>
          </div>

          <div className="bg-surface-container-high rounded-xl p-4 space-y-2.5 border border-outline-variant">
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Guest Stats</p>
            {[
              ['Total Spend',    formatMoney(selected.spend)],
              ['Total Visits',   selected.visits],
              ['Last Visit',     selected.lastVisit],
              ['Favourite Item', selected.fav || '—'],
              ['Guest ID',       selected.id],
            ].map(([k, v]) => (
              <div key={String(k)} className="flex justify-between text-sm">
                <span className="text-on-surface-variant">{k}</span>
                <span className="text-on-surface font-medium text-right max-w-[130px] truncate">{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Loyalty Points</p>
              <span className="text-xs text-on-surface-variant">/ 1000</span>
            </div>
            <p className="text-2xl font-bold font-headline text-primary mb-2">{pts.toFixed(0)}</p>
            <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
              <motion.div key={selected.id} initial={{ width: 0 }} animate={{ width: `${(pts / 1000) * 100}%` }} transition={{ duration: 0.7 }}
                className="h-full bg-primary rounded-full" />
            </div>
            {pts >= 1000 && <p className="text-[10px] text-secondary font-bold mt-1.5">🎉 Reward available!</p>}
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant space-y-2">
          <button className="w-full py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-sm">Send Offer</button>
          <button className="w-full py-2.5 bg-surface-container-high text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm border border-outline-variant">View Full History</button>
        </div>
      </div>

      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <CustomerModal title={modal === 'add' ? 'Add New Guest' : 'Edit Guest'} onClose={() => setModal(null)} onSave={handleSave} form={form} setForm={setForm} />
        )}
        {deleteTarget && (
          <DeleteConfirm name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        )}
      </AnimatePresence> 

      
    </div>
  );
}
