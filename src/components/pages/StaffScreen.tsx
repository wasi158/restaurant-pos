import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { UserPlus, Pencil, Trash2, Shield } from 'lucide-react';
import staffData from '../../mock/staff.json';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Badge } from '../atoms/Badge';
import { SearchBar } from '../molecules/SearchBar';
import { FormField } from '../molecules/FormField';
import { Pagination } from '../molecules/Pagination';
import { ModalShell } from '../organisms/ModalShell';
import { ConfirmDialog } from '../organisms/ConfirmDialog';
import { PageHeader } from '../organisms/PageHeader';

type ShiftStatus = 'on-shift' | 'off-duty' | 'on-break';
type StaffMember = {
  id: string; name: string; role: string; status: ShiftStatus;
  image: string; phone: string; email: string;
};

const STAFF_ROLES: string[] = staffData.roles;
const INITIAL_STAFF: StaffMember[] = staffData.items as StaffMember[];
const STAFF_ACTIVITY_LOG = staffData.activityLog;
const BLANK_STAFF_MEMBER: Omit<StaffMember, 'id'> = staffData.blankItem as Omit<StaffMember, 'id'>;

const statusCfg: Record<ShiftStatus, { label: string; dot: string; badgeVariant: 'success' | 'warning' | 'neutral' }> = {
  'on-shift': { label: 'On Shift',  dot: 'bg-secondary', badgeVariant: 'success' },
  'off-duty': { label: 'Off Duty',  dot: 'bg-outline',   badgeVariant: 'neutral' },
  'on-break': { label: 'On Break',  dot: 'bg-tertiary',  badgeVariant: 'warning' },
};

const STATUS_OPTIONS = [
  { value: 'on-shift', label: 'On Shift' },
  { value: 'off-duty', label: 'Off Duty' },
  { value: 'on-break', label: 'On Break' },
];

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

  const onShift = staff.filter(s => s.status === 'on-shift').length;

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
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto min-h-full">
      <PageHeader
        title="Staff Management"
        subtitle={`${onShift} active on shift · ${staff.length} total`}
        actions={
          <>
            <Button variant="secondary" icon={<Shield className="w-4 h-4" />}>Permissions</Button>
            <Button onClick={openAdd} icon={<UserPlus className="w-4 h-4" />}>Add Staff</Button>
          </>
        }
      />

      <SearchBar value={search} onChange={setSearch} placeholder="Search staff…" className="max-w-xs" />

      {/* Staff Cards */}
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
                  <Badge variant={cfg.badgeVariant} className="uppercase text-[10px]">{cfg.label}</Badge>
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

      {/* Activity Log */}
      <div>
        <h3 className="font-bold font-headline text-on-surface mb-3">Activity Log</h3>
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
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
          <ModalShell
            title={modal === 'add' ? 'Add New Staff' : 'Edit Staff'}
            onClose={() => setModal(null)}
            onSave={handleSave}
            saveLabel="Save Staff"
            saveDisabled={!form.name.trim()}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Full Name" required className="col-span-2">
                  <Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. John Smith" fullWidth />
                </FormField>
                <FormField label="Role">
                  <Select value={form.role} onChange={v => setForm({ ...form, role: v })} options={STAFF_ROLES} fullWidth />
                </FormField>
                <FormField label="Status">
                  <Select value={form.status} onChange={v => setForm({ ...form, status: v as ShiftStatus })} options={STATUS_OPTIONS} fullWidth />
                </FormField>
                <FormField label="Email">
                  <Input value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="name@restaurant-pos.com" fullWidth />
                </FormField>
                <FormField label="Phone">
                  <Input value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+1 555-0000" fullWidth />
                </FormField>
                <FormField label="Photo URL" className="col-span-2">
                  <Input value={form.image} onChange={v => setForm({ ...form, image: v })} placeholder="https://..." fullWidth />
                </FormField>
              </div>
            </div>
          </ModalShell>
        )}
        {deleteTarget && (
          <ConfirmDialog
            title="Remove Staff"
            message={<>Remove <span className="font-semibold text-on-surface">"{deleteTarget.name}"</span> from the system? This cannot be undone.</>}
            confirmLabel="Remove"
            variant="danger"
            onConfirm={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
