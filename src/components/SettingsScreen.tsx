import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Store, Bell, CreditCard, Printer, Users,
  Save, CheckCircle2, Wifi,
  UserPlus, Trash2,
} from 'lucide-react';
import { useAppSettings, SUPPORTED_CURRENCIES, type SupportedCurrency } from '../lib/appSettings';

const SECTIONS = [
  { id: 'restaurant', label: 'Restaurant Profile', icon: Store },
  { id: 'pos',        label: 'POS & Payments',     icon: CreditCard },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'printer',    label: 'Printer & Hardware',  icon: Printer },
  { id: 'users',      label: 'User Management',     icon: Users },
];

type User = { id: string; name: string; role: string; email: string; active: boolean };

const INITIAL_USERS: User[] = [
  { id: 'U1', name: 'Marcus V.',    role: 'General Manager', email: 'marcus@restaurant-pos.com',  active: true  },
  { id: 'U2', name: 'Julian R.',    role: 'Head Waiter',     email: 'julian@restaurant-pos.com',  active: true  },
  { id: 'U3', name: 'Elena R.',     role: 'Executive Chef',  email: 'elena@restaurant-pos.com',   active: true  },
  { id: 'U4', name: 'Sarah C.',     role: 'Head Cashier',    email: 'sarah@restaurant-pos.com',   active: false },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`relative w-10 h-5.5 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-surface-container-highest'}`}
      style={{ height: 22, width: 40 }}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-outline-variant last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-on-surface">{label}</p>
        {hint && <p className="text-xs text-on-surface-variant mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 w-56" />
  );
}

export function SettingsScreen() {
  const { currency, setCurrency } = useAppSettings();
  const [section, setSection]   = useState('restaurant');
  const [saved, setSaved]       = useState(false);

  // Restaurant profile
  const [restName, setRestName]     = useState('Restaurant POS');
  const [restEmail, setRestEmail]   = useState('hello@restaurant-pos.com');
  const [restPhone, setRestPhone]   = useState('+1 555-9000');
  const [restAddr, setRestAddr]     = useState('42 Ember Lane, New York, NY 10001');
  const [timezone, setTimezone]     = useState('America/New_York');

  // POS
  const [taxRate, setTaxRate]       = useState('10');
  const [serviceCharge, setService] = useState('0');
  const [autoDiscount, setAutoDisc] = useState(false);
  const [splitBill, setSplitBill]   = useState(true);
  const [receiptFooter, setFooter]  = useState('Thank you for dining with us!');

  // Notifications
  const [emailNotif, setEmailNotif]   = useState(true);
  const [smsNotif, setSmsNotif]       = useState(false);
  const [lowStockAlert, setLowStock]  = useState(true);
  const [orderReady, setOrderReady]   = useState(true);
  const [dailyReport, setDailyReport] = useState(true);
  const [soundAlert, setSoundAlert]   = useState(true);

  // Printer
  const [printerName, setPrinterName] = useState('Epson TM-T88VI');
  const [printerIP, setPrinterIP]     = useState('192.168.1.100');
  const [autoPrint, setAutoPrint]     = useState(true);
  const [kitchenPrint, setKitchenPrint] = useState(true);
  const [receiptCopies, setReceiptCopies] = useState('1');

  // Users
  const [users, setUsers]   = useState<User[]>(INITIAL_USERS);
  const [newName, setNewName]   = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole]   = useState('Waiter');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addUser = () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setUsers(prev => [...prev, { id: `U${Date.now()}`, name: newName, role: newRole, email: newEmail, active: true }]);
    setNewName(''); setNewEmail(''); setNewRole('Waiter');
  };

  const toggleUser = (id: string) => setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u));
  const removeUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const renderSection = () => {
    switch (section) {
      case 'restaurant': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">Restaurant Profile</h2>
          <p className="text-sm text-on-surface-variant mb-5">Basic information about your restaurant.</p>
          <Field label="Restaurant Name"><Input value={restName} onChange={setRestName} placeholder="Restaurant name" /></Field>
          <Field label="Contact Email"><Input value={restEmail} onChange={setRestEmail} placeholder="email@restaurant.com" type="email" /></Field>
          <Field label="Phone Number"><Input value={restPhone} onChange={setRestPhone} placeholder="+1 555-0000" /></Field>
          <Field label="Address" hint="Used on receipts and reports"><Input value={restAddr} onChange={setRestAddr} placeholder="Street, City, State" /></Field>
          <Field
            label="Currency"
            hint="Saved on this device. POS, menu, inventory, receipts, and reports use this for display."
          >
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as SupportedCurrency)}
              className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 w-44"
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c} value={c}>
                  {c === 'PKR' ? 'PKR — Pakistani Rupee' : c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Timezone">
            <select value={timezone} onChange={e => setTimezone(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 w-56">
              {['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris'].map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
        </div>
      );

      case 'pos': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">POS & Payments</h2>
          <p className="text-sm text-on-surface-variant mb-5">Configure tax, charges and payment options.</p>
          <Field label="Tax Rate (%)" hint="Applied to all orders">
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)}
                className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 w-24 text-right" />
              <span className="text-sm text-on-surface-variant">%</span>
            </div>
          </Field>
          <Field label="Service Charge (%)" hint="Optional service charge">
            <div className="flex items-center gap-2">
              <input type="number" min="0" max="100" step="0.1" value={serviceCharge} onChange={e => setService(e.target.value)}
                className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 w-24 text-right" />
              <span className="text-sm text-on-surface-variant">%</span>
            </div>
          </Field>
          <Field label="Auto Discount for VIP" hint="Apply 10% discount for VIP customers automatically">
            <Toggle value={autoDiscount} onChange={setAutoDisc} />
          </Field>
          <Field label="Split Bill" hint="Allow splitting bills between guests">
            <Toggle value={splitBill} onChange={setSplitBill} />
          </Field>
          <Field label="Receipt Footer Message" hint="Printed at the bottom of every receipt">
            <input value={receiptFooter} onChange={e => setFooter(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 w-64" />
          </Field>
        </div>
      );

      case 'notifications': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">Notifications</h2>
          <p className="text-sm text-on-surface-variant mb-5">Control how and when you receive alerts.</p>
          <Field label="Email Notifications" hint="Receive reports and alerts via email"><Toggle value={emailNotif} onChange={setEmailNotif} /></Field>
          <Field label="SMS Notifications" hint="Receive urgent alerts via SMS"><Toggle value={smsNotif} onChange={setSmsNotif} /></Field>
          <Field label="Low Stock Alerts" hint="Alert when inventory falls below minimum level"><Toggle value={lowStockAlert} onChange={setLowStock} /></Field>
          <Field label="Order Ready Alerts" hint="Notify when kitchen marks an order as ready"><Toggle value={orderReady} onChange={setOrderReady} /></Field>
          <Field label="Daily Summary Report" hint="Receive end-of-day performance report"><Toggle value={dailyReport} onChange={setDailyReport} /></Field>
          <Field label="Sound Alerts" hint="Play audio when new orders arrive"><Toggle value={soundAlert} onChange={setSoundAlert} /></Field>
        </div>
      );

      case 'printer': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">Printer & Hardware</h2>
          <p className="text-sm text-on-surface-variant mb-5">Configure receipt and kitchen printers.</p>
          <Field label="Printer Model"><Input value={printerName} onChange={setPrinterName} placeholder="e.g. Epson TM-T88VI" /></Field>
          <Field label="Printer IP Address" hint="Local network IP of the printer"><Input value={printerIP} onChange={setPrinterIP} placeholder="192.168.1.100" /></Field>
          <Field label="Auto-Print Receipts" hint="Automatically print receipt after payment"><Toggle value={autoPrint} onChange={setAutoPrint} /></Field>
          <Field label="Kitchen Ticket Printing" hint="Print order tickets to kitchen printer"><Toggle value={kitchenPrint} onChange={setKitchenPrint} /></Field>
          <Field label="Receipt Copies" hint="Number of receipt copies to print">
            <select value={receiptCopies} onChange={e => setReceiptCopies(e.target.value)}
              className="bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 w-24">
              {['1', '2', '3'].map(n => <option key={n}>{n}</option>)}
            </select>
          </Field>
          <div className="pt-4">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-high border border-outline-variant text-on-surface font-semibold rounded-xl hover:bg-surface-bright transition-all text-sm">
              <Wifi className="w-4 h-4" /> Test Printer Connection
            </button>
          </div>
        </div>
      );

      case 'users': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">User Management</h2>
          <p className="text-sm text-on-surface-variant mb-5">Manage terminal access and roles.</p>

          {/* Add user */}
          <div className="bg-surface-container-high rounded-2xl p-4 border border-outline-variant mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Add New User</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Full name"
                className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address"
                className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <select value={newRole} onChange={e => setNewRole(e.target.value)}
                className="bg-surface-container-low border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                {['Manager', 'Head Waiter', 'Waiter', 'Executive Chef', 'Sous Chef', 'Cashier', 'Bartender', 'Host'].map(r => <option key={r}>{r}</option>)}
              </select>
              <button onClick={addUser} disabled={!newName.trim() || !newEmail.trim()}
                className="flex items-center justify-center gap-2 py-2 bg-primary text-on-primary-container font-semibold rounded-xl hover:brightness-105 transition-all text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <UserPlus className="w-4 h-4" /> Add User
              </button>
            </div>
          </div>

          {/* User list */}
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.role} · {user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${user.active ? 'bg-secondary/10 text-secondary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                  <Toggle value={user.active} onChange={() => toggleUser(user.id)} />
                  <button onClick={() => removeUser(user.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left nav */}
      <div className="w-56 bg-surface-container-low border-r border-outline-variant flex flex-col shrink-0">
        <div className="p-5 border-b border-outline-variant">
          <h1 className="font-bold font-headline text-on-surface">Settings</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Configure your terminal</p>
        </div>
        <nav className="p-3 space-y-0.5 flex-1">
          {SECTIONS.map(s => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-primary text-on-primary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>
                <s.icon className={`w-4 h-4 shrink-0 ${active ? 'text-on-primary-container' : 'text-on-surface-variant'}`} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
          <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {renderSection()}
          </motion.div>
        </div>

        {/* Save bar */}
        <div className="border-t border-outline-variant px-8 py-4 flex items-center justify-between bg-surface-container-low">
          <p className="text-xs text-on-surface-variant">
            Currency saves automatically. Other profile fields are session-only until wired to storage.
          </p>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition-all text-sm ${saved ? 'bg-secondary/15 border border-secondary/30 text-secondary' : 'bg-primary text-on-primary-container hover:brightness-105 shadow-md'}`}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>
    </div>
  );
}
