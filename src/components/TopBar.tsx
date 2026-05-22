import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Sun, Moon, Cloud, Minus, Square, X, Check } from 'lucide-react';
import { useElectron } from '../hooks/useElectron';
import { motion, AnimatePresence } from 'motion/react';
import { useAppSettings } from '../lib/appSettings';

const MOCK_NOTIFS = [
  { id: 1, title: 'Low Stock Alert', desc: 'Truffle Oil is running low (2 units left).', time: '10m ago', unread: true, type: 'warning' },
  { id: 2, title: 'New VIP Reservation', desc: 'Table 14 booked for 8 PM by Mr. Sterling.', time: '1h ago', unread: true, type: 'info' },
  { id: 3, title: 'Shift Update', desc: 'Sarah clocked in 15 mins late.', time: '2h ago', unread: false, type: 'default' }
];

interface TopBarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export function TopBar({ theme, toggleTheme }: TopBarProps) {
  const { isElectron } = useElectron();
  const { currency } = useAppSettings();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, unread: false })));
  };

  return (
    <header className="h-14 bg-surface-container-low/95 backdrop-blur-xl flex items-center justify-between px-5 border-b border-outline-variant sticky top-0 z-40 drag-region shrink-0">

      {/* Search */}
      <div className="flex-1 no-drag max-w-xs">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-3.5 h-3.5 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search tables, orders, guests…"
            className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-2 pl-9 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/60 transition-all"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 no-drag">

        {/* Kitchen live badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-secondary/10 border border-secondary/25 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Kitchen Live</span>
        </div>

        <div
          className="hidden md:flex items-center px-2.5 py-1 rounded-lg bg-surface-container-high border border-outline-variant text-[10px] font-bold text-on-surface-variant uppercase tracking-wider"
          title={`Receipts, POS, and reports format money as ${currency}`}
        >
          {currency}
        </div>

        {/* Icon buttons — yellow tint on hover/active */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className="w-8 h-8 flex items-center justify-center rounded-xl text-on-surface-variant hover:text-primary hover:bg-primary/15 transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifs(!showNotifs)}
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all relative ${showNotifs ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-primary hover:bg-primary/15'}`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full ring-1 ring-surface-container-low animate-pulse" />}
          </button>
          
          <AnimatePresence>
            {showNotifs && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 bg-surface-container-low border border-outline-variant shadow-2xl rounded-2xl overflow-hidden z-50 text-left"
              >
                <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-high/50">
                  <h3 className="font-bold text-sm text-on-surface">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-1">
                      <Check className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifs.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => setNotifs(notifs.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                      className={`p-4 border-b border-outline-variant last:border-0 hover:bg-surface-container-high transition-colors cursor-pointer ${n.unread ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-xs font-bold leading-tight ${n.unread ? 'text-on-surface' : 'text-on-surface-variant'}`}>{n.title}</h4>
                        <span className="text-[10px] text-on-surface-variant whitespace-nowrap">{n.time}</span>
                      </div>
                      <p className={`text-xs mt-1 leading-snug ${n.unread ? 'text-on-surface-variant' : 'text-on-surface-variant/70'}`}>{n.desc}</p>
                    </div>
                  ))}
                  {notifs.length === 0 && (
                    <div className="p-8 text-center text-on-surface-variant text-xs">No notifications yet</div>
                  )}
                </div>
                <div className="p-2 border-t border-outline-variant bg-surface-container-high/50 text-center">
                  <button className="text-[10px] text-on-surface font-semibold hover:text-primary transition-colors">View All History</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button className="w-8 h-8 flex items-center justify-center rounded-xl text-secondary hover:text-primary hover:bg-primary/15 transition-all">
          <Cloud className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-outline-variant mx-1" />

        {/* User */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div className="w-8 h-8 rounded-full ring-2 ring-primary/50 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=80&h=80"
              alt="Manager"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="hidden md:block leading-none">
            <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">Marcus V.</p>
            <p className="text-[10px] text-primary mt-0.5 font-medium">General Manager</p>
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center ml-1 pl-3 border-l border-outline-variant gap-0.5">
          <button className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors">
            <Square className="w-3 h-3" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-error/15 hover:text-error transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
