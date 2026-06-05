import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/organisms/Sidebar';
import { TopBar } from './components/organisms/TopBar';
import { DashboardScreen } from './components/pages/DashboardScreen';
import { POSScreen } from './components/pages/POSScreen';
import { OrdersScreen } from './components/pages/OrdersScreen';
import { MenuScreen } from './components/pages/MenuScreen';
import { TablesScreen } from './components/pages/TablesScreen';
import { InventoryScreen } from './components/pages/InventoryScreen';
import { StaffScreen } from './components/pages/StaffScreen';
import { ReportsScreen } from './components/pages/ReportsScreen';
import { CustomersScreen } from './components/pages/CustomersScreen';
import { SettingsScreen } from './components/pages/SettingsScreen';
import { SupportScreen } from './components/pages/SupportScreen';
import { KitchenScreen } from './components/pages/KitchenScreen';
import { RecipeBuilderScreen } from './components/pages/RecipeBuilderScreen';
import { VendorsScreen } from './components/pages/VendorsScreen';
import { DealsScreen } from './components/pages/DealsScreen';
import { BillSlipScreen, BillOrder } from './components/pages/BillSlipScreen';
import { ExpiryScreen } from './components/pages/ExpiryScreen';
import { ReceivePaymentScreen } from './components/pages/ReceivePaymentScreen';
import { motion, AnimatePresence } from 'motion/react';
import { printReceipt } from './lib/printReceipt';
import { WindowControls } from './components/molecules/WindowControls';
import { useElectron } from './hooks/useElectron';

export default function App() {
  const { showCustomWindowControls, maximized, setMaximized } = useElectron();
  const [activeTab, setActiveTab]           = useState('dashboard');
  const [theme, setTheme]                   = useState<'dark' | 'light'>('dark');
  const [currentOrder, setCurrentOrder]     = useState<BillOrder | null>(null);
  const [billAutoPrint, setBillAutoPrint]   = useState(false);
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [paymentHighlightId, setPaymentHighlightId] = useState<string | null>(null);
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
      case 'dashboard': return <DashboardScreen onNavigate={setActiveTab} />;
      case 'orders':    return <OrdersScreen onPrintReceipt={(order) => showBillSlip(order, { autoPrint: true })} />;
      case 'menu':      return <MenuScreen />;
      case 'tables':    return (
        <TablesScreen
          onGoToPos={() => setActiveTab('pos')}
          onGoToReceivePayment={() => setActiveTab('receive-payment')}
        />
      );
      case 'receive-payment': return (
        <ReceivePaymentScreen
          highlightOrderId={paymentHighlightId}
          onPaymentComplete={(order) => {
            setPaymentHighlightId(null);
            showBillSlip({ ...order, billKind: 'paid' }, { autoPrint: true });
          }}
        />
      );
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
      case 'expiry':    return <ExpiryScreen />;
      case 'pos':       return (
        <POSScreen
          onOrderCreated={(bill, orderId) => {
            setPaymentHighlightId(orderId);
            showBillSlip(bill, { autoPrint: true });
          }}
        />
      );
      case 'bill-slip': return (
        <BillSlipScreen
          order={currentOrder}
          onNewOrder={() => {
            setCurrentOrder(null);
            setBillAutoPrint(false);
            setActiveTab('pos');
          }}
          onReceivePayment={
            currentOrder?.billKind === 'customer_due'
              ? () => setActiveTab('receive-payment')
              : undefined
          }
        />
      );
      default:          return <DashboardScreen />;
    }
  };

  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden font-sans selection:bg-primary/20">
      {showCustomWindowControls && (
        <WindowControls maximized={maximized} onMaximizedChange={setMaximized} />
      )}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setSidebarOpen(false); }}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden min-w-0 min-h-0">
        <TopBar theme={theme} toggleTheme={toggleTheme} onMenuClick={() => setSidebarOpen(true)} />

        <div
          id="app-page-scroll"
          className="flex-1 min-h-0 h-0 overflow-y-auto overflow-x-hidden relative overscroll-y-contain"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full min-h-full"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full -z-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-secondary/5 blur-[80px] rounded-full -z-10 pointer-events-none" />
      </main>

    </div>
  );
}
