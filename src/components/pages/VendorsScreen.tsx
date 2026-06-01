import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  UserPlus,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Building2,
  Ban,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Badge } from '../atoms/Badge';
import { Avatar } from '../atoms/Avatar';
import { SearchBar } from '../molecules/SearchBar';
import { FormField } from '../molecules/FormField';
import { Pagination } from '../molecules/Pagination';
import { ModalShell } from '../organisms/ModalShell';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { PageHeader } from '../organisms/PageHeader';
import { usePos } from '../../lib/pos/store';
import type { Vendor } from '../../lib/pos/types';

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
    <ModalShell
      title={title}
      onClose={onClose}
      onSave={onSave}
      saveLabel={submitLabel}
      saveDisabled={!form.name.trim()}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Vendor name" required className="col-span-2">
          <Input
            value={form.name}
            onChange={v => f('name', v)}
            placeholder="e.g. Metro Produce Co."
            fullWidth
          />
        </FormField>
        <FormField label="Contact name" className="col-span-2">
          <Input
            value={form.contactName}
            onChange={v => f('contactName', v)}
            placeholder="Primary buyer or rep"
            fullWidth
          />
        </FormField>
        <FormField label="Email">
          <Input
            value={form.email}
            onChange={v => f('email', v)}
            placeholder="orders@vendor.example"
            fullWidth
          />
        </FormField>
        <FormField label="Phone">
          <Input
            value={form.phone}
            onChange={v => f('phone', v)}
            placeholder="+1 555-0000"
            fullWidth
          />
        </FormField>
        <FormField label="Address" className="col-span-2">
          <Input
            value={form.address}
            onChange={v => f('address', v)}
            placeholder="Street, city, or remittance address"
            fullWidth
          />
        </FormField>
        <FormField label="Account #">
          <Input
            value={form.accountNumber}
            onChange={v => f('accountNumber', v)}
            placeholder="Optional"
            fullWidth
          />
        </FormField>
        <FormField label="Payment terms">
          <Input
            value={form.paymentTerms}
            onChange={v => f('paymentTerms', v)}
            placeholder="Net 30, COD, etc."
            fullWidth
          />
        </FormField>
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
        <FormField label="Notes" className="col-span-2">
          <textarea
            value={form.notes}
            onChange={e => f('notes', e.target.value)}
            placeholder="Delivery windows, SKU prefixes, etc."
            rows={3}
            className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
        </FormField>
      </div>
    </ModalShell>
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

  return (
    <div className="flex flex-col lg:flex-row min-h-full overflow-x-hidden">
      <div className="flex-1 flex flex-col overflow-hidden lg:border-r border-outline-variant">
        <div className="p-5 border-b border-outline-variant">
          <PageHeader
            title="Vendors"
            subtitle={`${vendors.length} suppliers on file`}
            actions={
              <Button variant="primary" size="sm" icon={<UserPlus className="w-3.5 h-3.5" />} onClick={openAdd}>
                Add vendor
              </Button>
            }
            className="mb-3"
          />

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
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search vendors…"
              className="flex-1 min-w-[140px]"
            />
            <div className="flex gap-1">
              {(['All', 'Active', 'Inactive'] as const).map(t => (
                <Button
                  key={t}
                  variant={statusFilter === t ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(t)}
                  className="rounded-full"
                >
                  {t}
                </Button>
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
                  <Avatar name={v.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-on-surface truncate">{v.name}</p>
                      <Badge variant={v.active ? 'success' : 'neutral'} className="text-[9px] uppercase px-1.5 py-0.5">
                        {v.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-on-surface-variant truncate">{v.email || v.phone || v.contactName || '—'}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={e => {
                      e.stopPropagation();
                      openEdit(v);
                    }}
                    aria-label={`Edit ${v.name}`}
                  />
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

      <div className="hidden lg:flex w-full lg:w-80 bg-surface-container-low flex-col shrink-0 min-w-0">
        {selected ? (
          <>
            <div className="p-5 border-b border-outline-variant">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={selected.name} size="lg" />
                  <div className="min-w-0">
                    <h2 className="font-bold font-headline text-on-surface leading-tight break-words">{selected.name}</h2>
                    <Badge
                      variant={selected.active ? 'success' : 'neutral'}
                      className="text-[9px] uppercase mt-1"
                    >
                      {selected.active ? 'Active supplier' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<Pencil className="w-3.5 h-3.5" />}
                      onClick={() => openEdit(selected)}
                      aria-label="Edit vendor"
                      className="w-7 h-7"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setDeleteTarget(selected)}
                      aria-label="Remove vendor"
                      className="w-7 h-7 hover:text-error hover:bg-error/10"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(selected)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Edit vendor
                  </Button>
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
          <ConfirmDialog
            title="Remove vendor"
            message={
              <>Remove <span className="font-semibold text-on-surface">{`"${deleteTarget.name}"`}</span> from your supplier list?</>
            }
            confirmLabel="Remove"
            variant="danger"
            icon={<Trash2 className="w-5 h-5 text-error" />}
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
