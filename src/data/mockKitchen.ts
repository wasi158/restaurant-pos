export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';
export type Priority    = 'rush' | 'normal';

export type KitchenItem = { name: string; qty: number; note?: string; done: boolean };
export type KitchenOrder = {
  id: string; table: string; server: string; status: OrderStatus;
  priority: Priority; placedAt: number; items: KitchenItem[];
  station: string; guests: number;
};

export const STATIONS = ['All', 'Grill', 'Pasta', 'Cold', 'Bar', 'Dessert'];

export const INITIAL_KITCHEN_ORDERS: KitchenOrder[] = [
  {
    id: 'ORD-1041', table: 'Table 3',  server: 'Julian R.',  status: 'Preparing', priority: 'rush',
    placedAt: Date.now() - 7 * 60000, station: 'Grill', guests: 2,
    items: [
      { name: 'Wagyu Burger',       qty: 2, note: 'No onions on one', done: true  },
      { name: 'Truffle Fries',      qty: 1, done: false },
      { name: 'Cabernet Sauvignon', qty: 2, done: false },
    ],
  },
  {
    id: 'ORD-1038', table: 'Table 12', server: 'Julian R.',  status: 'Pending',   priority: 'normal',
    placedAt: Date.now() - 2 * 60000, station: 'Cold', guests: 2,
    items: [
      { name: 'Miso Cod',     qty: 1, done: false },
      { name: 'Tuna Tartare', qty: 1, note: 'Extra wasabi', done: false },
    ],
  },
  {
    id: 'ORD-1037', table: 'Table 5',  server: 'Derrick S.', status: 'Preparing', priority: 'normal',
    placedAt: Date.now() - 12 * 60000, station: 'Pasta', guests: 2,
    items: [
      { name: 'Truffle Pasta',  qty: 2, done: true  },
      { name: 'Crème Brûlée',   qty: 1, done: false },
    ],
  },
  {
    id: 'ORD-1042', table: 'Bar-01',   server: 'Marco V.',   status: 'Pending',   priority: 'rush',
    placedAt: Date.now() - 1 * 60000, station: 'Bar', guests: 4,
    items: [
      { name: 'Espresso Martini', qty: 3, done: false },
      { name: 'Craft Lager',      qty: 2, done: false },
    ],
  },
  {
    id: 'ORD-1043', table: 'Table 8',  server: 'Derrick S.', status: 'Preparing', priority: 'normal',
    placedAt: Date.now() - 18 * 60000, station: 'Grill', guests: 3,
    items: [
      { name: 'Ribeye Steak',  qty: 2, note: 'Medium rare', done: true  },
      { name: 'Burrata Salad', qty: 1, done: true  },
      { name: 'Lava Cake',     qty: 2, done: false },
    ],
  },
  {
    id: 'ORD-1044', table: 'Table 2',  server: 'Marco V.',   status: 'Ready',     priority: 'normal',
    placedAt: Date.now() - 22 * 60000, station: 'Pasta', guests: 1,
    items: [
      { name: 'Smoked Salmon Bowl', qty: 1, done: true },
      { name: 'Craft Lager',        qty: 1, done: true },
    ],
  },
];
