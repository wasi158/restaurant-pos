import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Store, Bell, CreditCard, Printer, Users,
  Save, CheckCircle2, Wifi,
  UserPlus, Trash2,
} from 'lucide-react';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { Select } from '../atoms/Select';
import { Toggle } from '../atoms/Toggle';
import { Badge } from '../atoms/Badge';
import { Avatar } from '../atoms/Avatar';
import { FormField } from '../molecules/FormField';
import { useAppSettings, SUPPORTED_CURRENCIES, type SupportedCurrency } from '../../lib/appSettings';

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

const TIMEZONE_OPTIONS = ['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris'];
const ROLE_OPTIONS = ['Manager', 'Head Waiter', 'Waiter', 'Executive Chef', 'Sous Chef', 'Cashier', 'Bartender', 'Host'];

export function SettingsScreen() {
  const { currency, setCurrency } = useAppSettings();
  const [section, setSection] = useState('restaurant');
  const [saved, setSaved] = useState(false);

  const [restName, setRestName] = useState('Restaurant POS');
  const [restEmail, setRestEmail] = useState('hello@restaurant-pos.com');
  const [restPhone, setRestPhone] = useState('+1 555-9000');
  const [restAddr, setRestAddr] = useState('42 Ember Lane, New York, NY 10001');
  const [timezone, setTimezone] = useState('America/New_York');

  const [taxRate, setTaxRate] = useState('10');
  const [serviceCharge, setService] = useState('0');
  const [autoDiscount, setAutoDisc] = useState(false);
  const [splitBill, setSplitBill] = useState(true);
  const [receiptFooter, setFooter] = useState('Thank you for dining with us!');

  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [lowStockAlert, setLowStock] = useState(true);
  const [orderReady, setOrderReady] = useState(true);
  const [dailyReport, setDailyReport] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);

  const [printerName, setPrinterName] = useState('Epson TM-T88VI');
  const [printerIP, setPrinterIP] = useState('192.168.1.100');
  const [autoPrint, setAutoPrint] = useState(true);
  const [kitchenPrint, setKitchenPrint] = useState(true);
  const [receiptCopies, setReceiptCopies] = useState('1');

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Waiter');

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };
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
          <FormField label="Restaurant Name" horizontal><Input value={restName} onChange={setRestName} placeholder="Restaurant name" /></FormField>
          <FormField label="Contact Email" horizontal><Input value={restEmail} onChange={setRestEmail} placeholder="email@restaurant.com" type="email" /></FormField>
          <FormField label="Phone Number" horizontal><Input value={restPhone} onChange={setRestPhone} placeholder="+1 555-0000" /></FormField>
          <FormField label="Address" hint="Used on receipts and reports" horizontal><Input value={restAddr} onChange={setRestAddr} placeholder="Street, City, State" /></FormField>
          <FormField label="Currency" hint="POS, menu, inventory, receipts, and reports use this for display." horizontal>
            <Select
              value={currency}
              onChange={(v) => setCurrency(v as SupportedCurrency)}
              options={SUPPORTED_CURRENCIES.map(c => ({ value: c, label: c === 'PKR' ? 'PKR — Pakistani Rupee' : c }))}
              className="w-44"
            />
          </FormField>
          <FormField label="Timezone" horizontal>
            <Select value={timezone} onChange={setTimezone} options={TIMEZONE_OPTIONS} />
          </FormField>
        </div>
      );

      case 'pos': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">POS & Payments</h2>
          <p className="text-sm text-on-surface-variant mb-5">Configure tax, charges and payment options.</p>
          <FormField label="Tax Rate (%)" hint="Applied to all orders" horizontal>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="100" step="0.1" value={taxRate} onChange={setTaxRate} className="w-24 text-right" />
              <span className="text-sm text-on-surface-variant">%</span>
            </div>
          </FormField>
          <FormField label="Service Charge (%)" hint="Optional service charge" horizontal>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="100" step="0.1" value={serviceCharge} onChange={setService} className="w-24 text-right" />
              <span className="text-sm text-on-surface-variant">%</span>
            </div>
          </FormField>
          <FormField label="Auto Discount for VIP" hint="Apply 10% discount for VIP customers automatically" horizontal><Toggle value={autoDiscount} onChange={setAutoDisc} /></FormField>
          <FormField label="Split Bill" hint="Allow splitting bills between guests" horizontal><Toggle value={splitBill} onChange={setSplitBill} /></FormField>
          <FormField label="Receipt Footer Message" hint="Printed at the bottom of every receipt" horizontal>
            <Input value={receiptFooter} onChange={setFooter} className="w-64" />
          </FormField>
        </div>
      );

      case 'notifications': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">Notifications</h2>
          <p className="text-sm text-on-surface-variant mb-5">Control how and when you receive alerts.</p>
          <FormField label="Email Notifications" hint="Receive reports and alerts via email" horizontal><Toggle value={emailNotif} onChange={setEmailNotif} /></FormField>
          <FormField label="SMS Notifications" hint="Receive urgent alerts via SMS" horizontal><Toggle value={smsNotif} onChange={setSmsNotif} /></FormField>
          <FormField label="Low Stock Alerts" hint="Alert when inventory falls below minimum level" horizontal><Toggle value={lowStockAlert} onChange={setLowStock} /></FormField>
          <FormField label="Order Ready Alerts" hint="Notify when kitchen marks an order as ready" horizontal><Toggle value={orderReady} onChange={setOrderReady} /></FormField>
          <FormField label="Daily Summary Report" hint="Receive end-of-day performance report" horizontal><Toggle value={dailyReport} onChange={setDailyReport} /></FormField>
          <FormField label="Sound Alerts" hint="Play audio when new orders arrive" horizontal><Toggle value={soundAlert} onChange={setSoundAlert} /></FormField>
        </div>
      );

      case 'printer': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">Printer & Hardware</h2>
          <p className="text-sm text-on-surface-variant mb-5">Configure receipt and kitchen printers.</p>
          <FormField label="Printer Model" horizontal><Input value={printerName} onChange={setPrinterName} placeholder="e.g. Epson TM-T88VI" /></FormField>
          <FormField label="Printer IP Address" hint="Local network IP of the printer" horizontal><Input value={printerIP} onChange={setPrinterIP} placeholder="192.168.1.100" /></FormField>
          <FormField label="Auto-Print Receipts" hint="Automatically print receipt after payment" horizontal><Toggle value={autoPrint} onChange={setAutoPrint} /></FormField>
          <FormField label="Kitchen Ticket Printing" hint="Print order tickets to kitchen printer" horizontal><Toggle value={kitchenPrint} onChange={setKitchenPrint} /></FormField>
          <FormField label="Receipt Copies" hint="Number of receipt copies to print" horizontal>
            <Select value={receiptCopies} onChange={setReceiptCopies} options={['1', '2', '3']} className="w-24" />
          </FormField>
          <div className="pt-4">
            <Button variant="secondary" icon={<Wifi className="w-4 h-4" />}>Test Printer Connection</Button>
          </div>
        </div>
      );

      case 'users': return (
        <div>
          <h2 className="font-bold font-headline text-on-surface text-lg mb-1">User Management</h2>
          <p className="text-sm text-on-surface-variant mb-5">Manage terminal access and roles.</p>

          <div className="bg-surface-container-high rounded-2xl p-4 border border-outline-variant mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-3">Add New User</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input value={newName} onChange={setNewName} placeholder="Full name" fullWidth className="bg-surface-container-low" />
              <Input value={newEmail} onChange={setNewEmail} placeholder="Email address" fullWidth className="bg-surface-container-low" />
              <Select value={newRole} onChange={setNewRole} options={ROLE_OPTIONS} fullWidth className="bg-surface-container-low" />
              <Button onClick={addUser} disabled={!newName.trim() || !newEmail.trim()} icon={<UserPlus className="w-4 h-4" />} className="justify-center">
                Add User
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center gap-4 p-4 bg-surface-container-high rounded-2xl border border-outline-variant">
                <Avatar name={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">{user.name}</p>
                  <p className="text-xs text-on-surface-variant">{user.role} · {user.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={user.active ? 'success' : 'neutral'}>{user.active ? 'Active' : 'Inactive'}</Badge>
                  <Toggle value={user.active} onChange={() => toggleUser(user.id)} />
                  <Button variant="ghost" size="icon" onClick={() => removeUser(user.id)} className="hover:text-error hover:bg-error/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
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
    <div className="flex flex-col md:flex-row min-h-full overflow-x-hidden">
      <div className="w-full md:w-56 bg-surface-container-low md:border-r border-b md:border-b-0 border-outline-variant flex md:flex-col shrink-0">
        <div className="p-5 border-b border-outline-variant">
          <h1 className="font-bold font-headline text-on-surface">Settings</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">Configure your terminal</p>
        </div>
        <nav className="p-3 flex md:flex-col gap-1 md:gap-0.5 overflow-x-auto md:overflow-x-visible flex-1">
          {SECTIONS.map(s => {
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 whitespace-nowrap ${active ? 'bg-primary text-on-primary-container font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}>
                <s.icon className={`w-4 h-4 shrink-0 ${active ? 'text-on-primary-container' : 'text-on-surface-variant'}`} />
                {s.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
          <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }}>
            {renderSection()}
          </motion.div>
        </div>

        <div className="border-t border-outline-variant px-8 py-4 flex items-center justify-between bg-surface-container-low">
          <p className="text-xs text-on-surface-variant">
            Currency saves automatically. Other profile fields are session-only until wired to storage.
          </p>
          <Button
            variant={saved ? 'secondary' : 'primary'}
            onClick={handleSave}
            icon={saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            className={saved ? 'bg-secondary/15 border-secondary/30 text-secondary' : ''}
          >
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
