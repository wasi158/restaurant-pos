import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Truck,
  UserPlus,
  Pencil,
  Trash2,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Building2,
  Ban,
} from 'lucide-react';
import { Pagination } from './Pagination';
import { usePos } from '../lib/pos/store';
import type { Vendor } from '../lib/pos/types';

const BLANK_VENDOR: Omit<Vendor, 'id'> = {
  name: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  accountNumber: '',
  paymentTerms: 'Net 30',
  notes: '',
  active: true,
};

function VendorModal({
  title,
  submitLabel,
  onClose,
  onSave,
  form,
  setForm,
}: {
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSave: () => void;
  form: Omit<Vendor, 'id'>;
  setForm: (f: Omit<Vendor, 'id'>) => void;
}) {
  const f = (field: keyof typeof form, val: string | number | boolean) =>
    setForm({ ...form, [field]: val } as Omit<Vendor, 'id'>);

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
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-outline-variant shrink-0">
          <h2 className="font-bold font-headline text-on-surface text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-surface-container-high text-on-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Vendor name *</label>
              <input
                value={form.name}
                onChange={e => f('name', e.target.value)}
                placeholder="e.g. Metro Produce Co."
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Contact name</label>
              <input
                value={form.contactName}
                onChange={e => f('contactName', e.target.value)}
                placeholder="Primary buyer or rep"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Email</label>
              <input
                value={form.email}
                onChange={e => f('email', e.target.value)}
                placeholder="orders@vendor.example"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Phone</label>
              <input
                value={form.phone}
                onChange={e => f('phone', e.target.value)}
                placeholder="+1 555-0000"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Address</label>
              <input
                value={form.address}
                onChange={e => f('address', e.target.value)}
                placeholder="Street, city, or remittance address"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Account #</label>
              <input
                value={form.accountNumber}
                onChange={e => f('accountNumber', e.target.value)}
                placeholder="Optional"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Payment terms</label>
              <input
                value={form.paymentTerms}
                onChange={e => f('paymentTerms', e.target.value)}
                placeholder="Net 30, COD, etc."
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="col-span-2 flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2.5">
              <input
                id="vendor-active"
                type="checkbox"
                checked={form.active}
                onChange={e => f('active', e.target.checked)}
                className="rounded border-outline-variant text-primary focus:ring-primary/40"
              />
              <label htmlFor="vendor-active" className="text-sm text-on-surface cursor-pointer">
                Active supplier (shows in filters)
              </label>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Notes</label>
              <textarea
                value={form.notes}
                onChange={e => f('notes', e.target.value)}
                placeholder="Delivery windows, SKU prefixes, etc."
                rows={3}
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
              />
            </div>
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
            disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
          >
            {submitLabel}
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
        <h3 className="font-bold font-headline text-on-surface text-lg mb-1">Remove vendor</h3>
        <p className="text-sm text-on-surface-variant mb-6">
          Remove <span className="font-semibold text-on-surface">{`"${name}"`}</span> from your supplier list?
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

export function VendorsScreen() {
  const { state, actions } = usePos();
  const vendors = state.vendors;

  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [form, setForm] = useState<Omit<Vendor, 'id'>>(BLANK_VENDOR);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter(v => {
      if (statusFilter === 'Active' && !v.active) return false;
      if (statusFilter === 'Inactive' && v.active) return false;
      if (!q) return true;
      return (
        v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.phone.toLowerCase().includes(q) ||
        v.contactName.toLowerCase().includes(q) ||
        v.id.toLowerCase().includes(q)
      );
    });
  }, [vendors, search, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (vendors.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !vendors.some(v => v.id === selectedId)) {
      setSelectedId(vendors[0].id);
    }
  }, [vendors, selectedId]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const selected = vendors.find(v => v.id === selectedId) ?? null;

  const activeCount = vendors.filter(v => v.active).length;
  const inactiveCount = vendors.length - activeCount;

  const openAdd = () => {
    setForm({ ...BLANK_VENDOR });
    setEditTarget(null);
    setModal('add');
  };

  const openEdit = (v: Vendor) => {
    setSelectedId(v.id);
    setEditTarget(v);
    setForm({
      name: v.name,
      contactName: v.contactName,
      email: v.email,
      phone: v.phone,
      address: v.address,
      accountNumber: v.accountNumber,
      paymentTerms: v.paymentTerms,
      notes: v.notes,
      active: v.active,
    });
    setModal('edit');
  };

  const handleSave = () => {
    const newId = `VEN-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    const normalized: Vendor = {
      id: modal === 'add' ? newId : (editTarget?.id ?? selectedId ?? newId),
      name: form.name.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      accountNumber: form.accountNumber.trim(),
      paymentTerms: form.paymentTerms.trim() || '—',
      notes: form.notes.trim(),
      active: form.active,
    };
    actions.vendors.upsert(normalized);
    setSelectedId(normalized.id);
    setModal(null);
    setEditTarget(null);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      actions.vendors.remove(deleteTarget.id);
      if (selectedId === deleteTarget.id) setSelectedId(null);
    }
    setDeleteTarget(null);
  };

  const initials = (name: string) =>
    name
      .split(/\s+/)
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'V';

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden border-r border-outline-variant">
        <div className="p-5 border-b border-outline-variant">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div>
              <h1 className="text-xl font-bold font-headline text-on-surface">Vendors</h1>
              <p className="text-xs text-on-surface-variant mt-0.5">{vendors.length} suppliers on file</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-xs shadow-md"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add vendor
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {[
              { label: 'Total', value: vendors.length, icon: Building2 },
              { label: 'Active', value: activeCount, icon: Truck },
              { label: 'Inactive', value: inactiveCount, icon: Ban },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-surface-container-high rounded-xl p-3 border border-outline-variant flex items-center gap-2"
              >
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
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vendors…"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-1.5 pl-8 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex gap-1">
              {(['All', 'Active', 'Inactive'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setStatusFilter(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    statusFilter === t
                      ? 'bg-primary text-on-primary-container'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
            <AnimatePresence>
              {paginatedData.map(v => (
                <motion.div
                  key={v.id}
                  role="button"
                  tabIndex={0}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  onClick={() => setSelectedId(v.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedId(v.id);
                    }
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                    selectedId === v.id
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-surface-container-high border-outline-variant hover:bg-surface-bright'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {initials(v.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-on-surface truncate">{v.name}</p>
                      <span
                        className={`inline-flex text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                          v.active ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {v.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">{v.email || v.phone || v.contactName || '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      openEdit(v);
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                    aria-label={`Edit ${v.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant shrink-0 pointer-events-none" aria-hidden />
                </motion.div>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-10">
                {vendors.length === 0 ? 'No vendors yet. Add your first supplier.' : 'No vendors match your search or filter.'}
              </p>
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

      <div className="w-80 bg-surface-container-low flex flex-col shrink-0 min-w-0">
        {selected ? (
          <>
            <div className="p-5 border-b border-outline-variant">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {initials(selected.name)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-bold font-headline text-on-surface leading-tight break-words">{selected.name}</h2>
                    <span
                      className={`inline-flex text-[9px] font-bold uppercase px-2 py-0.5 rounded-full mt-1 ${
                        selected.active ? 'bg-secondary/15 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {selected.active ? 'Active supplier' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(selected)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all"
                      aria-label="Edit vendor"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(selected)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all"
                      aria-label="Remove vendor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Edit vendor
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="bg-surface-container-high rounded-xl p-4 space-y-2.5 border border-outline-variant">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Contact</p>
                <div className="flex items-center gap-2 text-sm min-w-0">
                  <Mail className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                  <span className="text-on-surface truncate">{selected.email || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                  <span className="text-on-surface">{selected.phone || '—'}</span>
                </div>
                {selected.contactName ? (
                  <p className="text-xs text-on-surface">
                    <span className="text-on-surface-variant">Rep: </span>
                    {selected.contactName}
                  </p>
                ) : null}
              </div>

              <div className="bg-surface-container-high rounded-xl p-4 space-y-2.5 border border-outline-variant">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Account</p>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-on-surface-variant shrink-0 mt-0.5" />
                  <span className="text-on-surface break-words">{selected.address || '—'}</span>
                </div>
                {[
                  ['Account #', selected.accountNumber || '—'],
                  ['Payment terms', selected.paymentTerms || '—'],
                  ['Vendor ID', selected.id],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-2 text-sm">
                    <span className="text-on-surface-variant shrink-0">{k}</span>
                    <span className="text-on-surface font-medium text-right break-all">{v}</span>
                  </div>
                ))}
              </div>

              {selected.notes ? (
                <div className="bg-surface-container-high rounded-xl p-4 border border-outline-variant">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Notes</p>
                  <p className="text-sm text-on-surface whitespace-pre-wrap">{selected.notes}</p>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant text-sm">
            <Truck className="w-10 h-10 mb-3 opacity-40" />
            <p>Select a vendor or add a new one to see details here.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <VendorModal
            title={modal === 'add' ? 'Add vendor' : 'Edit vendor'}
            submitLabel={modal === 'add' ? 'Add vendor' : 'Save changes'}
            onClose={() => {
              setModal(null);
              setEditTarget(null);
            }}
            onSave={handleSave}
            form={form}
            setForm={setForm}
          />
        )}
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
