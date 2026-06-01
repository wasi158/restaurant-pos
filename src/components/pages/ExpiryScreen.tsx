import React, { useState, useMemo, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarX2, Clock, XCircle, CheckCircle2, Search, ShieldAlert, ArrowUpDown } from 'lucide-react';
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import { Badge } from '../atoms/Badge';
import { Button } from '../atoms/Button';
import { StatCard } from '../molecules/StatCard';
import { SearchBar } from '../molecules/SearchBar';
import { CategoryFilter } from '../molecules/CategoryFilter';
import { Pagination } from '../molecules/Pagination';
import { PageHeader } from '../organisms/PageHeader';
import { getExpiryStatus, expiryLabel, daysUntilExpiry, type ExpiryStatus } from '../../lib/pos/expiry';
import type { InventoryItem } from '../../lib/pos/types';

type SortKey = 'expiry' | 'name' | 'category' | 'stock';

const EXPIRY_FILTERS = [
  { key: 'all',           label: 'All Items' },
  { key: 'expired',       label: 'Expired' },
  { key: 'expiring_soon', label: 'Expiring Soon' },
  { key: 'ok',            label: 'Fresh' },
  { key: 'no_date',       label: 'No Date Set' },
] as const;

type FilterKey = (typeof EXPIRY_FILTERS)[number]['key'];

const expiryBadgeCfg: Record<ExpiryStatus, { variant: 'error' | 'warning' | 'success' | 'neutral'; icon: React.ElementType }> = {
  expired:       { variant: 'error',   icon: CalendarX2 },
  expiring_soon: { variant: 'warning', icon: Clock },
  ok:            { variant: 'success', icon: CheckCircle2 },
  no_date:       { variant: 'neutral', icon: Clock },
};

function groupByDate(items: InventoryItem[]): { label: string; items: InventoryItem[] }[] {
  const groups = new Map<string, InventoryItem[]>();

  for (const item of items) {
    const key = item.expiryDate ?? 'no-date';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  const entries = Array.from(groups.entries()).sort(([a], [b]) => {
    if (a === 'no-date') return 1;
    if (b === 'no-date') return -1;
    return a.localeCompare(b);
  });

  return entries.map(([key, items]) => {
    if (key === 'no-date') return { label: 'No Expiry Date Set', items };
    const d = daysUntilExpiry(key);
    const dateStr = new Date(key + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
    let tag = '';
    if (d < 0) tag = ` — Expired ${Math.abs(d)} day${Math.abs(d) !== 1 ? 's' : ''} ago`;
    else if (d === 0) tag = ' — Expires Today';
    else if (d === 1) tag = ' — Expires Tomorrow';
    else if (d <= 3) tag = ` — Expires in ${d} days`;
    return { label: dateStr + tag, items };
  });
}

export function ExpiryScreen() {
  const { formatMoney } = useAppSettings();
  const { state } = usePos();
  const items = state.inventory;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [viewMode, setViewMode] = useState<'date' | 'product'>('date');
  const [sortKey, setSortKey] = useState<SortKey>('expiry');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const expiredCount = useMemo(() => items.filter(i => getExpiryStatus(i) === 'expired').length, [items]);
  const soonCount = useMemo(() => items.filter(i => getExpiryStatus(i) === 'expiring_soon').length, [items]);
  const freshCount = useMemo(() => items.filter(i => getExpiryStatus(i) === 'ok').length, [items]);
  const noDateCount = useMemo(() => items.filter(i => getExpiryStatus(i) === 'no_date').length, [items]);

  const filtered = useMemo(() => {
    let list = items.filter(i => {
      if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filter !== 'all' && getExpiryStatus(i) !== filter) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortKey === 'expiry') {
        const da = a.expiryDate ? daysUntilExpiry(a.expiryDate) : 99999;
        const db = b.expiryDate ? daysUntilExpiry(b.expiryDate) : 99999;
        return da - db;
      }
      if (sortKey === 'name') return a.name.localeCompare(b.name);
      if (sortKey === 'category') return a.category.localeCompare(b.category);
      if (sortKey === 'stock') return a.quantity - b.quantity;
      return 0;
    });

    return list;
  }, [items, search, filter, sortKey]);

  useEffect(() => { setCurrentPage(1); }, [search, filter, viewMode]);

  const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto min-h-full">
      <PageHeader
        title="Expiry Management"
        subtitle="Track product expiry dates and manage inventory freshness."
        actions={
          <div className="flex gap-1.5 bg-surface-container-high rounded-xl p-1 border border-outline-variant shrink-0">
            <button
              onClick={() => setViewMode('date')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'date' ? 'bg-primary text-on-primary-container shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              By Date
            </button>
            <button
              onClick={() => setViewMode('product')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'product' ? 'bg-primary text-on-primary-container shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              By Product
            </button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Expired"
          value={expiredCount}
          icon={<CalendarX2 className="w-4 h-4" />}
          className={expiredCount > 0 ? 'border-error/30 bg-error/5' : ''}
        />
        <StatCard
          label="Expiring Soon"
          value={soonCount}
          icon={<Clock className="w-4 h-4" />}
          className={soonCount > 0 ? 'border-tertiary/30 bg-tertiary/5' : ''}
        />
        <StatCard label="Fresh" value={freshCount} icon={<CheckCircle2 className="w-4 h-4" />} />
        <StatCard label="No Date Set" value={noDateCount} icon={<Clock className="w-4 h-4" />} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search products…" className="w-52" />
        <div className="flex gap-1.5 flex-wrap">
          {EXPIRY_FILTERS.map(f => {
            const count = f.key === 'all' ? items.length : f.key === 'expired' ? expiredCount : f.key === 'expiring_soon' ? soonCount : f.key === 'ok' ? freshCount : noDateCount;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  filter === f.key
                    ? f.key === 'expired' ? 'bg-error text-white'
                    : f.key === 'expiring_soon' ? 'bg-tertiary text-white'
                    : f.key === 'ok' ? 'bg-secondary text-white'
                    : 'bg-primary text-on-primary-container'
                    : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant'
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Date-wise View */}
      {viewMode === 'date' && (
        <div className="space-y-5">
          {dateGroups.map((group, gi) => {
            const firstItem = group.items[0];
            const groupStatus = firstItem?.expiryDate ? getExpiryStatus(firstItem) : 'no_date';
            const isUrgent = groupStatus === 'expired';
            const isWarning = groupStatus === 'expiring_soon';
            return (
              <motion.div
                key={group.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: gi * 0.04 }}
                className={`rounded-2xl border overflow-hidden ${
                  isUrgent ? 'border-error/30 bg-error/5' : isWarning ? 'border-tertiary/30 bg-tertiary/5' : 'border-outline-variant bg-surface-container-low'
                }`}
              >
                <div className={`px-5 py-3 border-b flex items-center gap-2 ${
                  isUrgent ? 'border-error/20 bg-error/8' : isWarning ? 'border-tertiary/20 bg-tertiary/8' : 'border-outline-variant bg-surface-container-high'
                }`}>
                  {isUrgent ? <CalendarX2 className="w-4 h-4 text-error" />
                    : isWarning ? <Clock className="w-4 h-4 text-tertiary" />
                    : <CheckCircle2 className="w-4 h-4 text-on-surface-variant" />}
                  <h3 className={`text-sm font-bold ${isUrgent ? 'text-error' : isWarning ? 'text-tertiary' : 'text-on-surface'}`}>
                    {group.label}
                  </h3>
                  <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                    isUrgent ? 'bg-error/15 text-error' : isWarning ? 'bg-tertiary/15 text-tertiary' : 'bg-surface-container-highest text-on-surface-variant'
                  }`}>
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-outline-variant">
                  {group.items.map(item => {
                    const es = getExpiryStatus(item);
                    const cfg = expiryBadgeCfg[es];
                    const IconComp = cfg.icon;
                    return (
                      <div key={item.id} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-container-high/50 transition-colors">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          es === 'expired' ? 'bg-error/10' : es === 'expiring_soon' ? 'bg-tertiary/10' : 'bg-surface-container-highest'
                        }`}>
                          <IconComp className={`w-4 h-4 ${
                            es === 'expired' ? 'text-error' : es === 'expiring_soon' ? 'text-tertiary' : 'text-on-surface-variant'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
                          <p className="text-[11px] text-on-surface-variant">{item.category} · {item.quantity} {item.unit}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge variant={cfg.variant}>{expiryLabel(item)}</Badge>
                          <p className="text-[10px] text-on-surface-variant mt-0.5 font-mono">
                            {formatMoney(item.costPerUnit * item.quantity)} value
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}

          {dateGroups.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-sm font-bold text-on-surface">No items match your filter</h3>
              <p className="text-xs text-on-surface-variant mt-1">Try adjusting the filter or search.</p>
            </div>
          )}
        </div>
      )}

      {/* Product-wise Table View */}
      {viewMode === 'product' && (
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant overflow-hidden overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-high text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                <th className="px-5 py-3.5 cursor-pointer hover:text-on-surface" onClick={() => setSortKey('name')}>
                  <span className="flex items-center gap-1">Product {sortKey === 'name' && <ArrowUpDown className="w-3 h-3" />}</span>
                </th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5 cursor-pointer hover:text-on-surface" onClick={() => setSortKey('stock')}>
                  <span className="flex items-center gap-1">Stock {sortKey === 'stock' && <ArrowUpDown className="w-3 h-3" />}</span>
                </th>
                <th className="px-5 py-3.5">Value</th>
                <th className="px-5 py-3.5 cursor-pointer hover:text-on-surface" onClick={() => setSortKey('expiry')}>
                  <span className="flex items-center gap-1">Expiry Date {sortKey === 'expiry' && <ArrowUpDown className="w-3 h-3" />}</span>
                </th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              <AnimatePresence>
                {paginatedData.map(item => {
                  const es = getExpiryStatus(item);
                  const cfg = expiryBadgeCfg[es];
                  const IconComp = cfg.icon;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-surface-container-high transition-colors ${
                        es === 'expired' ? 'bg-error/5' : es === 'expiring_soon' ? 'bg-tertiary/5' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-on-surface">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant font-mono">{item.id}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="neutral">{item.category}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold text-on-surface">{item.quantity}</span>
                        <span className="text-xs text-on-surface-variant ml-1">{item.unit}</span>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-bold text-primary font-mono">
                        {formatMoney(item.costPerUnit * item.quantity)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-on-surface">
                          {item.expiryDate
                            ? new Date(item.expiryDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </p>
                        <p className={`text-[11px] font-semibold mt-0.5 ${
                          es === 'expired' ? 'text-error' : es === 'expiring_soon' ? 'text-tertiary' : 'text-on-surface-variant'
                        }`}>
                          {expiryLabel(item)}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={cfg.variant} icon={<IconComp className="w-3 h-3" />}>
                          {es === 'expired' ? 'Expired' : es === 'expiring_soon' ? 'Expiring Soon' : es === 'ok' ? 'Fresh' : 'No Date'}
                        </Badge>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-sm text-on-surface-variant">
                    No items match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
      )}
    </div>
  );
}
