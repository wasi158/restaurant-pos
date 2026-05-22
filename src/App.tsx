import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardScreen } from './components/DashboardScreen';
import { POSScreen } from './components/POSScreen';
import { OrdersScreen } from './components/OrdersScreen';
import { MenuScreen } from './components/MenuScreen';
import { TablesScreen } from './components/TablesScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { StaffScreen } from './components/StaffScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { CustomersScreen } from './components/CustomersScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { SupportScreen } from './components/SupportScreen';
import { KitchenScreen } from './components/KitchenScreen';
import { SendToKitchenModal } from './components/SendToKitchenModal';
import { RecipeBuilderScreen } from './components/RecipeBuilderScreen';
import { VendorsScreen } from './components/VendorsScreen';
import { DealsScreen } from './components/DealsScreen';
import { BillSlipScreen, BillOrder } from './components/BillSlipScreen';
import { motion, AnimatePresence } from 'motion/react';
import { printReceipt } from './lib/printReceipt';

export default function App() {
  const [activeTab, setActiveTab]           = useState('dashboard');
  const [theme, setTheme]                   = useState<'dark' | 'light'>('dark');
  const [kitchenModalOpen, setKitchenModal] = useState(false);
  const [currentOrder, setCurrentOrder]     = useState<BillOrder | null>(null);
  const [billAutoPrint, setBillAutoPrint]   = useState(false);
  const showBillSlip = (order: BillOrder, opts?: { autoPrint?: boolean }) => {
    setCurrentOrder(order);
    setBillAutoPrint(opts?.autoPrint ?? false);
    setActiveTab('bill-slip');
  };

  useEffect(() => {
    if (activeTab !== 'bill-slip' || !billAutoPrint || !currentOrder) return undefined;
    const timer = window.setTimeout(() => {
      void printReceipt();
      setBillAutoPrint(false);
    }, 550);
    return () => window.clearTimeout(timer);
  }, [activeTab, billAutoPrint, currentOrder?.id]);

  const toggleTheme = () => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('light', next === 'light');
      return next;
    });
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardScreen />;
      case 'orders':    return <OrdersScreen onPrintReceipt={(order) => showBillSlip(order, { autoPrint: true })} />;
      case 'menu':      return <MenuScreen />;
      case 'tables':    return <TablesScreen onGoToPos={() => setActiveTab('pos')} />;
      case 'inventory': return <InventoryScreen />;
      case 'vendors':   return <VendorsScreen />;
      case 'deals':     return <DealsScreen />;
      case 'staff':     return <StaffScreen />;
      case 'reports':   return <ReportsScreen />;
      case 'customers': return <CustomersScreen />;
      case 'settings':  return <SettingsScreen />;
      case 'support':   return <SupportScreen />;
      case 'recipes':   return <RecipeBuilderScreen />;
      case 'kitchen':   return <KitchenScreen />;
      case 'pos':       return (
        <POSScreen onCharge={(order) => showBillSlip(order, { autoPrint: true })} />
      );
      case 'bill-slip': return (
        <BillSlipScreen
          order={currentOrder}
          onNewOrder={() => {
            setCurrentOrder(null);
            setBillAutoPrint(false);
            setActiveTab('pos');
          }}
        />
      );
      default:          return <DashboardScreen />;
    }
  };

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden font-sans selection:bg-primary/20">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSendToKitchen={() => setKitchenModal(true)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <TopBar theme={theme} toggleTheme={toggleTheme} />

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="h-full w-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 blur-[80px] rounded-full -z-10 pointer-events-none" />
      </main>

      {/* Send to Kitchen modal */}
      <AnimatePresence>
        {kitchenModalOpen && (
          <SendToKitchenModal onClose={() => setKitchenModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
