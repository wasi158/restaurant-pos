export type KitchenOrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Served';
export type KitchenPriority = 'rush' | 'normal';

export type KitchenLineItem = {
  name: string;
  qty: number;
  note?: string;
  done: boolean;
};

export type KitchenTicket = {
  id: string;
  table: string;
  server: string;
  status: KitchenOrderStatus;
  priority: KitchenPriority;
  placedAt: number;
  items: KitchenLineItem[];
  station: string;
  guests: number;
};

export type SendToKitchenInput = {
  orderId: string;
  table: string;
  items: Array<{ name: string; qty: number; category?: string }>;
  serviceChannel?: string;
  notes?: string;
};
