import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Timer, ArrowUpRight, ArrowDownRight, Flame, AlertCircle } from 'lucide-react';
import { hourlyData, topItems, stats, recentOrders } from '../data/mockDashboard';
import { useAppSettings } from '../lib/appSettings';

const PERIODS = ['Daily', 'Weekly', 'Monthly'] as const;
type DashboardPeriod = (typeof PERIODS)[number];

export function DashboardScreen() {
  const { formatMoney } = useAppSettings();
  const [period, setPeriod] = useState<DashboardPeriod>('Daily');

  const displayStats = useMemo(
    () =>
      stats.map((s, i) => {
        if (i === 0) return { ...s, value: formatMoney(12842) };
        if (i === 2) return { ...s, value: formatMoney(51.78) };
        return s;
      }),
    [formatMoney]
  );

  const { chartData, chartSubtitle, trendBadge } = useMemo(() => {
    if (period === 'Daily') {
      return {
        chartData: hourlyData,
        chartSubtitle: 'Hourly breakdown today',
        trendBadge: '+18% vs yesterday',
      };
    }
    if (period === 'Weekly') {
      return {
        chartData: [
          { time: 'Mon', revenue: 11200 },
          { time: 'Tue', revenue: 9800 },
          { time: 'Wed', revenue: 12400 },
          { time: 'Thu', revenue: 10600 },
          { time: 'Fri', revenue: 14200 },
          { time: 'Sat', revenue: 16800 },
          { time: 'Sun', revenue: 9100 },
        ],
        chartSubtitle: 'Daily totals this week',
        trendBadge: '+9% vs last week',
      };
    }
    return {
      chartData: [
        { time: 'Jan', revenue: 420000 },
        { time: 'Feb', revenue: 398000 },
        { time: 'Mar', revenue: 445000 },
        { time: 'Apr', revenue: 412000 },
      ],
      chartSubtitle: 'Monthly revenue (mock)',
      trendBadge: '+6% vs last year',
    };
  }, [period]);

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline text-on-surface">Service Overview</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Real-time metrics for the current shift.</p>
        </div>
        <div className="flex gap-1.5 bg-surface-container-high rounded-xl p-1 border border-outline-variant" role="tablist" aria-label="Dashboard period">
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p
                  ? 'bg-primary text-on-primary-container shadow'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-surface-container-high rounded-2xl p-5 border border-outline-variant group hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <span className={`flex items-center gap-0.5 text-[11px] font-bold ${s.up ? 'text-secondary' : 'text-error'}`}>
                {s.up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {s.change}
              </span>
            </div>
            <p className="text-2xl font-bold font-headline text-on-surface">{s.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-bold font-headline text-on-surface">Revenue Trend</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">{chartSubtitle}</p>
            </div>
            <span className="text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">{trendBadge}</span>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`dash-revenue-grad-${period}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#f5c842" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f5c842" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-outline-variant)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--color-on-surface-variant)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="var(--color-on-surface-variant)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v =>
                    formatMoney(Number(v), {
                      notation: 'compact',
                      compactDisplay: 'short',
                      maximumFractionDigits: 1,
                    })
                  }
                />
                <Tooltip
                  contentStyle={{ background: 'var(--color-surface-container-high)', border: '1px solid var(--color-outline-variant)', borderRadius: 10, fontSize: 12, color: 'var(--color-on-surface)' }}
                  formatter={(v: number) => [formatMoney(Number(v)), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#f5c842" strokeWidth={2.5} fill={`url(#dash-revenue-grad-${period})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top sellers */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant flex flex-col">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-4 h-4 text-tertiary" />
            <h3 className="font-bold font-headline text-on-surface">Top Sellers</h3>
          </div>
          <div className="space-y-4 flex-1">
            {topItems.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-on-surface">{item.name}</span>
                  <span className="text-on-surface-variant text-xs">{item.sold} sold</span>
                </div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="h-full rounded-full bg-primary rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-5 w-full py-2.5 bg-surface-container-high hover:bg-surface-bright text-on-surface text-xs font-semibold rounded-xl transition-all border border-outline-variant">
            View Full Analytics
          </button>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent orders */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
          <h3 className="font-bold font-headline text-on-surface mb-4">Recent Orders</h3>
          <div className="space-y-2.5">
            {recentOrders.map((o, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 bg-surface-container-high rounded-xl border border-outline-variant hover:border-primary/30 cursor-pointer transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{o.id}</div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{o.table}</p>
                    <p className="text-[11px] text-on-surface-variant">{o.items} items · {o.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-on-surface">{formatMoney(o.amount)}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.paid ? 'bg-secondary/10 text-secondary' : 'bg-tertiary/10 text-tertiary'}`}>
                    {o.paid ? 'Paid' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kitchen status */}
        <div className="bg-surface-container-low rounded-2xl p-6 border border-outline-variant">
          <h3 className="font-bold font-headline text-on-surface mb-4">Kitchen Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-error/8 border border-error/20 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-error" />
                <p className="text-sm font-semibold text-error">High Load Warning</p>
              </div>
              <span className="text-[11px] font-bold text-error">22m avg prep</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Active Tickets', value: '14', color: 'text-on-surface' },
                { label: 'Delayed',        value: '2',  color: 'text-error' },
                { label: 'Completed',      value: '38', color: 'text-secondary' },
              ].map((s, i) => (
                <div key={i} className="p-3.5 bg-surface-container-high rounded-xl border border-outline-variant text-center">
                  <p className={`text-xl font-bold font-headline ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-on-surface-variant mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
