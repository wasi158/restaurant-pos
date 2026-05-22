import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, Pencil, Trash2, X, Search, Shield, CheckCircle2, Clock, LogOut, Star, Utensils, Package, AlertCircle } from 'lucide-react';
import { ShiftStatus, StaffMember, STAFF_ROLES, INITIAL_STAFF, STAFF_ACTIVITY_LOG, BLANK_STAFF_MEMBER } from '../data/mockStaff';
import { Pagination } from './Pagination';



const statusCfg: Record<ShiftStatus, { label: string; color: string; bg: string; dot: string }> = {
  'on-shift': { label: 'On Shift',  color: 'text-secondary', bg: 'bg-secondary/10', dot: 'bg-secondary' },
  'off-duty': { label: 'Off Duty',  color: 'text-on-surface-variant', bg: 'bg-surface-container-highest', dot: 'bg-outline' },
  'on-break': { label: 'On Break',  color: 'text-tertiary',  bg: 'bg-tertiary/10',  dot: 'bg-tertiary'  },
};


function StaffModal({ title, onClose, onSave, form, setForm }: {
  title: string; onClose: () => void; onSave: () => void;
  form: Omit<StaffMember, 'id'>; setForm: (f: Omit<StaffMember, 'id'>) => void;
}) {
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
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. John Smith"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Role</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                {STAFF_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ShiftStatus })}
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                <option value="on-shift">On Shift</option>
                <option value="off-duty">Off Duty</option>
                <option value="on-break">On Break</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Email</label>
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="name@restaurant-pos.com"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Phone</label>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0000"
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Photo URL</label>
              <input value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..."
                className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-outline-variant">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">Cancel</button>
          <button onClick={onSave} disabled={!form.name.trim()}
            className="flex-1 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed shadow-md">
            Save Staff
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
        <h3 className="font-bold font-headline text-on-surface text-lg mb-1">Remove Staff</h3>
        <p className="text-sm text-on-surface-variant mb-6">Remove <span className="font-semibold text-on-surface">"{name}"</span> from the system? This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-error text-white font-semibold rounded-xl hover:brightness-105 transition-all text-sm">Remove</button>
        </div>
      </motion.div>
    </div>
  );
}

export function StaffScreen() {
  const [staff, setStaff]               = useState<StaffMember[]>(INITIAL_STAFF);
  const [search, setSearch]             = useState('');
  const [modal, setModal]               = useState<'add' | 'edit' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [editTarget, setEditTarget]     = useState<StaffMember | null>(null);
  const [form, setForm]                 = useState<Omit<StaffMember, 'id'>>(BLANK_STAFF_MEMBER);
  const [currentPage, setCurrentPage]   = useState(1);
  const [logPage, setLogPage]           = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filtered = staff.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const logTotalPages = Math.ceil(STAFF_ACTIVITY_LOG.length / ITEMS_PER_PAGE);
  const paginatedLog = STAFF_ACTIVITY_LOG.slice((logPage - 1) * ITEMS_PER_PAGE, logPage * ITEMS_PER_PAGE);

  const onShift  = staff.filter(s => s.status === 'on-shift').length;

  const openAdd  = () => { setForm(BLANK_STAFF_MEMBER); setModal('add'); };
  const openEdit = (s: StaffMember) => { setEditTarget(s); setForm({ name: s.name, role: s.role, status: s.status, image: s.image, phone: s.phone, email: s.email }); setModal('edit'); };

  const handleSave = () => {
    if (modal === 'add') {
      const newId = `EMP-${Math.floor(Math.random() * 9000) + 1000}`;
      setStaff(prev => [{ id: newId, ...form }, ...prev]);
    } else if (modal === 'edit' && editTarget) {
      setStaff(prev => prev.map(s => s.id === editTarget.id ? { ...s, ...form } : s));
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (deleteTarget) setStaff(prev => prev.filter(s => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="p-6 space-y-5 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface">Staff Management</h1>
          <p className="text-sm text-on-surface-variant mt-0.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" />
            {onShift} active on shift · {staff.length} total
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">
            <Shield className="w-4 h-4" /> Permissions
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all text-sm shadow-md">
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff…"
          className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-2 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {paginatedData.map((person) => {
            const cfg = statusCfg[person.status];
            return (
              <motion.div key={person.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-surface-container-high rounded-2xl p-5 border border-outline-variant hover:-translate-y-1 transition-all duration-200 ${person.status === 'off-duty' ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="relative">
                    {person.image
                      ? <img src={person.image} alt={person.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-outline-variant" />
                      : <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">{person.name[0]}</div>}
                    <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-surface-container-high ${cfg.dot}`} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(person)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-all">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(person)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-on-surface font-headline">{person.name}</h3>
                <p className="text-xs text-primary font-semibold mt-0.5">{person.role}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  <span className="text-[10px] text-on-surface-variant font-mono">{person.id}</span>
                </div>
                {person.email && <p className="text-[10px] text-on-surface-variant mt-2 truncate">{person.email}</p>}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="col-span-4 py-12 text-center text-on-surface-variant text-sm">No staff match your search.</div>
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

      {/* Activity log */}
      <div>
        <h3 className="font-bold font-headline text-on-surface mb-3">Activity Log</h3>
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container-high text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">Action</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {paginatedLog.map((log, i) => (
                <tr key={i} className="hover:bg-surface-container-high transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                        {log.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-medium text-on-surface">{log.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-on-surface-variant">{log.action}</td>
                  <td className="px-5 py-3.5 text-sm text-primary font-mono">{log.entity}</td>
                  <td className="px-5 py-3.5 text-sm text-on-surface-variant">{log.time}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-surface-container-high ${log.color}`}>{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination 
            currentPage={logPage}
            totalPages={logTotalPages}
            totalItems={STAFF_ACTIVITY_LOG.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setLogPage}
          />
        </div>
      </div>

      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <StaffModal title={modal === 'add' ? 'Add New Staff' : 'Edit Staff'} onClose={() => setModal(null)} onSave={handleSave} form={form} setForm={setForm} />
        )}
        {deleteTarget && (
          <DeleteConfirm name={deleteTarget.name} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
        )}
      </AnimatePresence>
    </div>
  );
}
