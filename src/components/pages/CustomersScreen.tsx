import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Crown, Star, UserCircle, TrendingUp, Calendar, DollarSign, ChevronRight, UserPlus, Pencil, Trash2, Phone, Mail } from 'lucide-react';
import customersData from '../../mock/customers.json';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Badge } from '../atoms/Badge';
import { Avatar } from '../atoms/Avatar';
import { SearchBar } from '../molecules/SearchBar';
import { FormField } from '../molecules/FormField';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { Pagination } from '../molecules/Pagination';
import { ModalShell } from '../organisms/ModalShell';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { PageHeader } from '../organisms/PageHeader';
import { useAppSettings } from '../../lib/appSettings';

type Tier = 'VIP' | 'Regular' | 'New';
type Customer = {
  id: string; name: string; email: string; phone: string;
  visits: number; spend: number; tier: Tier; lastVisit: string; fav: string;
};

const TIERS: Tier[] = customersData.tiers as Tier[];
const INITIAL_CUSTOMERS: Customer[] = customersData.items as Customer[];
const BLANK_CUSTOMER: Omit<Customer, 'id'> = customersData.blankItem as Omit<Customer, 'id'>;

const tierBadgeVariant: Record<Tier, 'info' | 'success' | 'warning'> = {
  VIP: 'info',
  Regular: 'success',
  New: 'warning',
};

const tierIcon: Record<Tier, React.ElementType> = {
  VIP: Crown,
  Regular: Star,
  New: UserCircle,
};


function CustomerModal({ title, onClose, onSave, form, setForm }: {
  title: string; onClose: () => void; onSave: () => void;
  form: Omit<Customer, 'id'>; setForm: (f: Omit<Customer, 'id'>) => void;
}) {
  const { currency } = useAppSettings();
  return (
    <ModalShell title={title} onClose={onClose} onSave={onSave} saveLabel="Save Guest" saveDisabled={!form.name.trim()}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Full Name" required className="col-span-2">
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Jane Smith" fullWidth />
          </FormField>
          <FormField label="Email">
            <Input value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="name@email.com" fullWidth />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="+1 555-0000" fullWidth />
          </FormField>
          <FormField label="Tier">
            <Select value={form.tier} onChange={(v) => setForm({ ...form, tier: v as Tier })} options={[...TIERS]} fullWidth />
          </FormField>
          <FormField label="Favourite Item">
            <Input value={form.fav} onChange={(v) => setForm({ ...form, fav: v })} placeholder="e.g. Wagyu Burger" fullWidth />
          </FormField>
          <FormField label="Total Visits">
            <Input type="number" min={0} value={form.visits || ''} onChange={(v) => setForm({ ...form, visits: parseInt(v) || 0 })} placeholder="0" fullWidth />
          </FormField>
          <FormField label={`Total spend (${currency})`}>
            <Input type="number" min={0} value={form.spend || ''} onChange={(v) => setForm({ ...form, spend: parseFloat(v) || 0 })} placeholder="0.00" fullWidth />
          </FormField>
        </div>
      </div>
    </ModalShell>
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
    <div className="flex flex-col lg:flex-row min-h-full overflow-x-hidden">
      {/* Left */}
      <div className="flex-1 flex flex-col overflow-hidden lg:border-r border-outline-variant">
        <div className="p-5 border-b border-outline-variant">
          <PageHeader
            title="Customers"
            subtitle={`${customers.length} guests on record`}
            actions={
              <Button size="sm" onClick={openAdd} icon={<UserPlus className="w-3.5 h-3.5" />}>
                Add Guest
              </Button>
            }
            className="mb-3"
          />

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total Spend',  value: formatMoney(totalSpend), icon: DollarSign },
              { label: 'Total Visits', value: totalVisits,             icon: Calendar   },
              { label: 'Avg Spend',    value: formatMoney(avgSpend),   icon: TrendingUp },
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
            <SearchBar value={search} onChange={setSearch} placeholder="Search guests…" className="flex-1 min-w-[140px]" />
            <CategoryFilter categories={['All', ...TIERS]} active={tierFilter} onChange={(v) => setTierFilter(v as 'All' | Tier)} />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <AnimatePresence>
              {paginatedData.map((c) => {
              const Icon = tierIcon[c.tier];
              return (
                <motion.button key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${selected.id === c.id ? 'bg-primary/10 border-primary/40' : 'bg-surface-container-high border-outline-variant hover:bg-surface-bright'}`}>
                  <Avatar name={c.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-on-surface truncate">{c.name}</p>
                      <Badge variant={tierBadgeVariant[c.tier]} icon={<Icon className="w-2.5 h-2.5" />} className="text-[9px] uppercase px-1.5 py-0.5">
                        {c.tier}
                      </Badge>
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
      <div className="hidden lg:flex w-full lg:w-72 bg-surface-container-low flex-col shrink-0">
        <div className="p-5 border-b border-outline-variant">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar name={selected.name} size="lg" />
              <div>
                <h2 className="font-bold font-headline text-on-surface leading-none">{selected.name}</h2>
                <Badge
                  variant={tierBadgeVariant[selected.tier]}
                  icon={React.createElement(tierIcon[selected.tier], { className: 'w-2.5 h-2.5' })}
                  className="mt-1 uppercase"
                >
                  {selected.tier} Member
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => openEdit(selected)} icon={<Pencil className="w-3.5 h-3.5" />} />
              <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(selected)} className="hover:text-error hover:bg-error/10" icon={<Trash2 className="w-3.5 h-3.5" />} />
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
          <Button variant="primary" className="w-full">Send Offer</Button>
          <Button variant="secondary" className="w-full">View Full History</Button>
        </div>
      </div>

      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <CustomerModal title={modal === 'add' ? 'Add New Guest' : 'Edit Guest'} onClose={() => setModal(null)} onSave={handleSave} form={form} setForm={setForm} />
        )}
        {deleteTarget && (
          <ConfirmDialog
            title="Remove Guest"
            message={<>Remove <span className="font-semibold text-on-surface">"{deleteTarget.name}"</span> from the guest list?</>}
            confirmLabel="Remove"
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
