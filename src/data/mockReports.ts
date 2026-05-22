export const PERIODS = ['Today', 'This Week', 'This Month', 'This Year'] as const;
export type Period = typeof PERIODS[number];

export type ChartData = { label: string; revenue: number; covers: number };
export type CategoryData = { name: string; value: number; color: string };
export type TopItemData = { name: string; sold: number; revenue: number; trend: 'up' | 'down' };
export type KPIData = { revenue: number; covers: number; avgCheck: number; tableTurn: number };

export const REPORTS_DATA: Record<Period, {
  chart: ChartData[];
  category: CategoryData[];
  topItems: TopItemData[];
  kpi: KPIData;
  prevKpi: KPIData;
}> = {
  Today: {
    chart: [
      { label: '11am', revenue: 820,  covers: 9  },
      { label: '12pm', revenue: 2400, covers: 28 },
      { label: '1pm',  revenue: 3100, covers: 36 },
      { label: '2pm',  revenue: 1800, covers: 21 },
      { label: '3pm',  revenue: 900,  covers: 10 },
      { label: '4pm',  revenue: 1200, covers: 14 },
      { label: '5pm',  revenue: 2800, covers: 32 },
      { label: '6pm',  revenue: 4200, covers: 48 },
      { label: '7pm',  revenue: 5600, covers: 64 },
      { label: '8pm',  revenue: 4900, covers: 56 },
      { label: '9pm',  revenue: 3200, covers: 37 },
    ],
    category: [
      { name: 'Mains',    value: 44, color: '#f5c842' },
      { name: 'Drinks',   value: 26, color: '#4ade80' },
      { name: 'Starters', value: 19, color: '#fb923c' },
      { name: 'Desserts', value: 11, color: '#f87171' },
    ],
    topItems: [
      { name: 'Wagyu Burger',     sold: 22, revenue: 616,  trend: 'up'   },
      { name: 'Ribeye Steak',     sold: 14, revenue: 728,  trend: 'up'   },
      { name: 'Espresso Martini', sold: 31, revenue: 403,  trend: 'up'   },
      { name: 'Truffle Pasta',    sold: 18, revenue: 441,  trend: 'down' },
      { name: 'Miso Cod',         sold: 11, revenue: 352,  trend: 'up'   },
    ],
    kpi:     { revenue: 30920, covers: 355, avgCheck: 87.1, tableTurn: 48 },
    prevKpi: { revenue: 27400, covers: 320, avgCheck: 85.6, tableTurn: 51 },
  },
  'This Week': {
    chart: [
      { label: 'Mon', revenue: 4200,  covers: 48  },
      { label: 'Tue', revenue: 3800,  covers: 42  },
      { label: 'Wed', revenue: 5100,  covers: 61  },
      { label: 'Thu', revenue: 4700,  covers: 55  },
      { label: 'Fri', revenue: 7200,  covers: 84  },
      { label: 'Sat', revenue: 8900,  covers: 102 },
      { label: 'Sun', revenue: 6400,  covers: 76  },
    ],
    category: [
      { name: 'Mains',    value: 42, color: '#f5c842' },
      { name: 'Drinks',   value: 28, color: '#4ade80' },
      { name: 'Starters', value: 18, color: '#fb923c' },
      { name: 'Desserts', value: 12, color: '#f87171' },
    ],
    topItems: [
      { name: 'Wagyu Burger',     sold: 142, revenue: 3976, trend: 'up'   },
      { name: 'Ribeye Steak',     sold: 98,  revenue: 5096, trend: 'up'   },
      { name: 'Espresso Martini', sold: 121, revenue: 1573, trend: 'up'   },
      { name: 'Truffle Pasta',    sold: 87,  revenue: 2131, trend: 'down' },
      { name: 'Miso Cod',         sold: 74,  revenue: 2368, trend: 'up'   },
    ],
    kpi:     { revenue: 40300, covers: 468, avgCheck: 86.1, tableTurn: 52 },
    prevKpi: { revenue: 35100, covers: 430, avgCheck: 87.9, tableTurn: 50 },
  },
  'This Month': {
    chart: [
      { label: 'Wk 1', revenue: 38200, covers: 441 },
      { label: 'Wk 2', revenue: 42100, covers: 488 },
      { label: 'Wk 3', revenue: 39800, covers: 461 },
      { label: 'Wk 4', revenue: 45600, covers: 528 },
    ],
    category: [
      { name: 'Mains',    value: 40, color: '#f5c842' },
      { name: 'Drinks',   value: 30, color: '#4ade80' },
      { name: 'Starters', value: 17, color: '#fb923c' },
      { name: 'Desserts', value: 13, color: '#f87171' },
    ],
    topItems: [
      { name: 'Ribeye Steak',     sold: 412, revenue: 21424, trend: 'up'   },
      { name: 'Wagyu Burger',     sold: 580, revenue: 16240, trend: 'up'   },
      { name: 'Espresso Martini', sold: 490, revenue:  6370, trend: 'up'   },
      { name: 'Miso Cod',         sold: 298, revenue:  9536, trend: 'down' },
      { name: 'Truffle Pasta',    sold: 344, revenue:  8428, trend: 'up'   },
    ],
    kpi:     { revenue: 165700, covers: 1918, avgCheck: 86.4, tableTurn: 54 },
    prevKpi: { revenue: 148200, covers: 1740, avgCheck: 85.2, tableTurn: 56 },
  },
  'This Year': {
    chart: [
      { label: 'Jan', revenue: 142000, covers: 1640 },
      { label: 'Feb', revenue: 128000, covers: 1480 },
      { label: 'Mar', revenue: 155000, covers: 1790 },
      { label: 'Apr', revenue: 162000, covers: 1870 },
      { label: 'May', revenue: 178000, covers: 2060 },
      { label: 'Jun', revenue: 195000, covers: 2250 },
      { label: 'Jul', revenue: 210000, covers: 2420 },
      { label: 'Aug', revenue: 204000, covers: 2360 },
      { label: 'Sep', revenue: 188000, covers: 2170 },
      { label: 'Oct', revenue: 172000, covers: 1990 },
      { label: 'Nov', revenue: 165000, covers: 1910 },
      { label: 'Dec', revenue: 220000, covers: 2540 },
    ],
    category: [
      { name: 'Mains',    value: 41, color: '#f5c842' },
      { name: 'Drinks',   value: 29, color: '#4ade80' },
      { name: 'Starters', value: 18, color: '#fb923c' },
      { name: 'Desserts', value: 12, color: '#f87171' },
    ],
    topItems: [
      { name: 'Ribeye Steak',     sold: 4820, revenue: 250640, trend: 'up'   },
      { name: 'Wagyu Burger',     sold: 6940, revenue: 194320, trend: 'up'   },
      { name: 'Espresso Martini', sold: 5880, revenue:  76440, trend: 'up'   },
      { name: 'Miso Cod',         sold: 3560, revenue: 113920, trend: 'up'   },
      { name: 'Truffle Pasta',    sold: 4120, revenue: 100940, trend: 'down' },
    ],
    kpi:     { revenue: 2119000, covers: 24480, avgCheck: 86.6, tableTurn: 53 },
    prevKpi: { revenue: 1940000, covers: 22400, avgCheck: 86.6, tableTurn: 55 },
  },
};
