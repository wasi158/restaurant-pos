export type TableStatus = 'ready' | 'occupied' | 'reserved' | 'cleaning';
export type TableType = 'round' | 'square' | 'bar' | 'booth';

export type Table = {
  id: string;
  status: TableStatus;
  type: TableType;
  top: string;
  left: string;
  size: string;
  amount?: string;
  time?: string;
  label?: string;
};

export const INITIAL_TABLES: Table[] = [
  { id: '101',    status: 'ready',    type: 'round',  top: '15%', left: '15%', size: 'w-32 h-32' },
  { id: '102',    status: 'occupied', type: 'round',  top: '15%', left: '35%', size: 'w-32 h-32', amount: '$142' },
  { id: '201',    status: 'reserved', type: 'square', top: '45%', left: '20%', size: 'w-20 h-20', time: '19:30' },
  { id: '202',    status: 'ready',    type: 'square', top: '45%', left: '30%', size: 'w-20 h-20' },
  { id: '203',    status: 'occupied', type: 'square', top: '45%', left: '40%', size: 'w-20 h-20', label: 'MAINS' },
  { id: 'BAR-01', status: 'cleaning', type: 'bar',    top: '75%', left: '15%', size: 'w-[420px] h-24' },
  { id: 'B04',    status: 'reserved', type: 'booth',  top: '20%', left: '65%', size: 'w-40 h-28', label: 'BOOTH RESERVED' },
  { id: '105',    status: 'ready',    type: 'round',  top: '55%', left: '60%', size: 'w-32 h-32' },
];

export const TABLE_STATUS_COLORS: Record<TableStatus, string> = {
  ready:    'bg-secondary',
  occupied: 'bg-error',
  reserved: 'bg-tertiary',
  cleaning: 'bg-outline',
};
