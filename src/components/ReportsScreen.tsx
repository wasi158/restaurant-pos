import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Clock, Download, ArrowUpRight, ArrowDownRight, CheckCircle2, Scale, Receipt } from 'lucide-react';
import { Period, PERIODS, REPORTS_DATA } from '../data/mockReports';
import { usePos } from '../lib/pos/store';
import { computePnL, type PnLSummary } from '../lib/pos/reportsPnL';
import { useAppSettings } from '../lib/appSettings';

function pct(curr: number, prev: number) {
  const d = ((curr - prev) / prev) * 100;
  return { val: Math.abs(d).toFixed(1) + '%', up: d >= 0 };
}

const tooltipStyle = {
  backgroundColor: 'var(--color-surface-container-high)',
  border: '1px solid var(--color-outline-variant)',
  borderRadius: 10,
  fontSize: 12,
  color: 'var(--color-on-surface)',
};

function exportCSV(period: Period, formatAmount: (n: number) => string, currency: string, livePnL?: PnLSummary) {
  const d = REPORTS_DATA[period];
  const { revenue, covers, avgCheck, tableTurn } = d.kpi;
  const p = d.prevKpi;
  const pctVal = (c: number, pr: number) => (((c - pr) / pr) * 100).toFixed(1) + '%';

  const sections: string[] = [];

  // Header
  sections.push(`Restaurant POS — Analytics Export`);
  sections.push(`Period: ${period}`);
  sections.push(`Display currency,${currency}`);
  sections.push(`Generated: ${new Date().toLocaleString()}`);
  sections.push('');

  // KPIs
  sections.push('── KEY PERFORMANCE INDICATORS ──');
  sections.push('Metric,Value,vs Previous Period');
  sections.push(`Total Revenue,${formatAmount(revenue)},${pctVal(revenue, p.revenue)}`);
  sections.push(`Total Covers,${covers.toLocaleString()},${pctVal(covers, p.covers)}`);
  sections.push(`Avg Check Size,${formatAmount(avgCheck)},${pctVal(avgCheck, p.avgCheck)}`);
  sections.push(`Avg Table Turn,${tableTurn} min,${pctVal(tableTurn, p.tableTurn)}`);
  sections.push('');

  // Revenue trend
  sections.push('── REVENUE TREND ──');
  sections.push(`Period,Revenue (${currency} numeric),Covers`);
  d.chart.forEach(row => sections.push(`${row.label},${row.revenue},${row.covers}`));
  sections.push('');

  // Category breakdown
  sections.push('── REVENUE BY CATEGORY ──');
  sections.push('Category,Share (%)');
  d.category.forEach(c => sections.push(`${c.name},${c.value}%`));
  sections.push('');

  // Top items
  sections.push('── TOP PERFORMING ITEMS ──');
  sections.push(`Rank,Item,Units Sold,Revenue (${currency}),Trend`);
  d.topItems.forEach((item, i) =>
    sections.push(`${i + 1},${item.name},${item.sold.toLocaleString()},${formatAmount(item.revenue)},${item.trend === 'up' ? '↑' : '↓'}`)
  );

  if (livePnL) {
    sections.push('');
    sections.push('── PROFIT & LOSS (LIVE POS) ──');
    sections.push(`Period filter,${livePnL.period}`);
    sections.push(`Range,${livePnL.rangeLabel}`);
    sections.push(`Metric,Amount (${currency})`);
    sections.push(`Revenue (subtotal pre-tax),${formatAmount(livePnL.revenueSubtotal)}`);
    sections.push(`Cost of goods sold (usage × unit cost),${formatAmount(livePnL.cogs)}`);
    sections.push(`Gross profit,${formatAmount(livePnL.grossProfit)}`);
    sections.push(`Gross margin (%),${livePnL.grossMarginPct.toFixed(2)}`);
    sections.push(`Tax collected,${formatAmount(livePnL.taxCollected)}`);
    sections.push(`Total collected (subtotal + tax),${formatAmount(livePnL.totalCollected)}`);
    sections.push(`Orders in range,${livePnL.orderCount}`);
    sections.push(`Line items sold (qty sum),${livePnL.itemsSold}`);
  }

  const csv = sections.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = `restaurant-pos-report-${period.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportsScreen() {
  const { formatMoney, currency } = useAppSettings();
  const { state } = usePos();
  const [period, setPeriod] = useState<Period>('This Week');
  const [exported, setExported] = useState(false);
  const d = REPORTS_DATA[period];

  const livePnL = useMemo(() => computePnL(state, period), [state, period]);

  const pnlBarData = useMemo(
    () => [
      { name: 'Revenue', amount: livePnL.revenueSubtotal, fill: 'var(--color-primary)' },
      { name: 'COGS', amount: livePnL.cogs, fill: '#fb923c' },
      { name: 'Gross profit', amount: livePnL.grossProfit, fill: 'var(--color-secondary)' },
    ],
    [livePnL.revenueSubtotal, livePnL.cogs, livePnL.grossProfit]
  );

  const handleExport = () => {
    exportCSV(period, formatMoney, currency, livePnL);
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  };

  const kpis = useMemo(() => {
    const dk = REPORTS_DATA[period];
    const { revenue, covers, avgCheck, tableTurn } = dk.kpi;
    const p = dk.prevKpi;
    const fc = (n: number) =>
      formatMoney(n, { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 });
    return [
      { label: 'Total Revenue',   value: fc(revenue),          ...pct(revenue,   p.revenue),   icon: DollarSign  },
      { label: 'Total Covers',    value: covers.toLocaleString(),       ...pct(covers,    p.covers),    icon: Users       },
      { label: 'Avg Check Size',  value: formatMoney(avgCheck),     ...pct(avgCheck,  p.avgCheck),  icon: ShoppingBag },
      { label: 'Avg Table Turn',  value: `${tableTurn} min`,            ...pct(tableTurn, p.tableTurn), icon: Clock       },
    ];
  }, [period, formatMoney]);

  const yFmt = useCallback(
    (v: number) =>
      formatMoney(v, { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 2 }),
    [formatMoney]
  );

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface">Reports & Analytics</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Amounts use <span className="font-semibold text-on-surface">{currency}</span> (Settings → Restaurant Profile). Demo charts use sample data;{' '}
            <span className="font-semibold text-on-surface">Profit and loss</span> below is from real POS orders in the selected range.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-high rounded-xl p-1 border border-outline-variant">
            {PERIODS.map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${period === p ? 'bg-primary text-on-primary-container shadow' : 'text-on-surface-variant hover:text-on-surface'}`}>
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 font-semibold rounded-xl transition-all text-sm ${
              exported
                ? 'bg-secondary/15 border border-secondary/30 text-secondary'
                : 'bg-surface-container-high border border-outline-variant text-on-surface hover:bg-primary/10 hover:border-primary/40 hover:text-primary'
            }`}
          >
            {exported
              ? <><CheckCircle2 className="w-4 h-4" /> Exported!</>
              : <><Download className="w-4 h-4" /> Export CSV</>}
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <AnimatePresence mode="wait">
        <motion.div key={period + '-kpi'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((k, i) => (
            <div key={i} className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                  <k.icon className="w-4 h-4 text-primary" />
                </div>
                <span className={`flex items-center gap-0.5 text-[11px] font-bold ${k.up ? 'text-secondary' : 'text-error'}`}>
                  {k.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {k.val}
                </span>
              </div>
              <p className="text-2xl font-bold font-headline text-on-surface">{k.value}</p>
              <p className="text-xs text-on-surface-variant mt-1">{k.label}</p>
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Live P&L from POS */}
      <AnimatePresence mode="wait">
        <motion.section
          key={period + '-pnl'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border border-outline-variant bg-surface-container-low p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-headline text-on-surface">Profit and loss</h2>
                <p className="text-xs text-on-surface-variant mt-1 max-w-[62ch] leading-relaxed">
                  <span className="font-semibold text-on-surface">{livePnL.period}</span>
                  <span className="text-on-surface-variant/70"> · </span>
                  {livePnL.rangeLabel}. Revenue is pre-tax subtotal from completed charges. COGS sums inventory deducted on those orders, valued at{' '}
                  <span className="font-semibold text-on-surface">current</span> inventory unit costs.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-high px-3 py-2 text-xs text-on-surface-variant shrink-0">
              <Receipt className="w-3.5 h-3.5 text-primary" />
              <span>
                <span className="font-bold text-on-surface">{livePnL.orderCount}</span> orders ·{' '}
                <span className="font-bold text-on-surface">{livePnL.itemsSold}</span> items sold
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Revenue (subtotal)', value: formatMoney(livePnL.revenueSubtotal), hint: 'Pre-tax sales' },
              { label: 'Cost of goods sold', value: formatMoney(livePnL.cogs), hint: 'From stock usage' },
              {
                label: 'Gross profit',
                value: formatMoney(livePnL.grossProfit),
                hint: livePnL.grossMarginPct.toFixed(1) + '% margin',
                accent: livePnL.grossProfit < 0,
              },
              { label: 'Tax collected', value: formatMoney(livePnL.taxCollected), hint: 'Pass-through' },
            ].map((row, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${
                  row.accent ? 'border-error/40 bg-error/5' : 'border-outline-variant bg-surface-container-high'
                }`}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{row.label}</p>
                <p className={`text-xl font-black font-headline mt-1 font-mono ${row.accent ? 'text-error' : 'text-on-surface'}`}>{row.value}</p>
                <p className="text-[10px] text-on-surface-variant mt-1">{row.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4">
              <h3 className="text-sm font-bold text-on-surface mb-3">Statement summary</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Revenue (subtotal)', formatMoney(livePnL.revenueSubtotal)],
                  ['Less: COGS', `− ${formatMoney(livePnL.cogs)}`],
                  ['Gross profit', formatMoney(livePnL.grossProfit)],
                  ['Gross margin', `${livePnL.grossMarginPct.toFixed(1)}%`],
                  ['Tax collected', formatMoney(livePnL.taxCollected)],
                  ['Total collected', formatMoney(livePnL.totalCollected)],
                ].map(([k, v]) => (
                  <div key={String(k)} className="flex justify-between gap-4 border-b border-outline-variant/60 pb-2 last:border-0 last:pb-0">
                    <dt className="text-on-surface-variant">{k}</dt>
                    <dd className="font-mono font-semibold text-on-surface text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4 min-h-[200px] flex flex-col">
              <h3 className="text-sm font-bold text-on-surface mb-3">Revenue vs COGS vs profit</h3>
              <div className="flex-1 min-h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pnlBarData} layout="vertical" margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="var(--color-on-surface-variant)"
                      fontSize={11}
                      tickFormatter={v => formatMoney(Number(v))}
                    />
                    <YAxis type="category" dataKey="name" stroke="var(--color-on-surface-variant)" fontSize={11} width={88} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: number) => [formatMoney(v), 'Amount']}
                    />
                    <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={28}>
                      {pnlBarData.map((e, i) => (
                        <Cell key={i} fill={e.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.section>
      </AnimatePresence>

      {/* Revenue chart + Category pie */}
      <AnimatePresence mode="wait">
        <motion.div key={period + '-charts'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Area chart */}
          <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold font-headline text-on-surface">Revenue Trend</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{period} — {d.chart.length} data points</p>
              </div>
              <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
                +{pct(d.kpi.revenue, d.prevKpi.revenue).val} vs prev
              </span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.chart}>
                  <defs>
                    <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#f5c842" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="#f5c842" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={yFmt} width={52} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatMoney(v), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#f5c842" strokeWidth={2.5} fill="url(#rg)" dot={false} activeDot={{ r: 5, fill: '#f5c842' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie chart */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant flex flex-col">
            <h3 className="font-bold font-headline text-on-surface mb-0.5">Revenue by Category</h3>
            <p className="text-xs text-on-surface-variant mb-4">Share of total sales</p>
            <div className="flex-1 min-h-[140px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.category} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value">
                    {d.category.map((c, i) => <Cell key={i} fill={c.color} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, '']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-3">
              {d.category.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-on-surface-variant">{c.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.value}%`, backgroundColor: c.color }} />
                    </div>
                    <span className="font-bold text-on-surface w-7 text-right">{c.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Covers bar + Top items */}
      <AnimatePresence mode="wait">
        <motion.div key={period + '-bottom'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Bar chart */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
            <h3 className="font-bold font-headline text-on-surface mb-0.5">Covers</h3>
            <p className="text-xs text-on-surface-variant mb-5">Guests served — {period}</p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={d.chart} barSize={period === 'This Year' ? 18 : 28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                  <XAxis dataKey="label" stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [v, 'Covers']} />
                  <Bar dataKey="covers" fill="#4ade80" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top items */}
          <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
            <h3 className="font-bold font-headline text-on-surface mb-0.5">Top Performing Items</h3>
            <p className="text-xs text-on-surface-variant mb-5">By revenue — {period}</p>
            <div className="space-y-4">
              {d.topItems.map((item, i) => {
                const maxRev = d.topItems[0].revenue;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-on-surface leading-none">{item.name}</p>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">{item.sold.toLocaleString()} sold</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-1.5">
                        <p className="text-sm font-bold text-primary">{formatMoney(item.revenue)}</p>
                        {item.trend === 'up'
                          ? <TrendingUp className="w-3.5 h-3.5 text-secondary" />
                          : <TrendingDown className="w-3.5 h-3.5 text-error" />}
                      </div>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <motion.div
                        key={period + item.name}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.revenue / maxRev) * 100}%` }}
                        transition={{ duration: 0.6, delay: i * 0.08 }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
