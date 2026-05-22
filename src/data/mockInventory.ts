export type InventoryItem = {
  id: string; name: string; category: string; unit: string;
  stock: number; min: number; cost: number; supplier: string;
};

export const CATEGORIES = ['Proteins', 'Produce', 'Dairy', 'Dry Goods', 'Beverages'];
export const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'btl', 'keg', 'box'];

export const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 'INV-001', name: 'Wagyu Beef',         category: 'Proteins',  unit: 'kg',  stock: 4.2,  min: 5,   cost: 85.00, supplier: 'Prime Cuts Co.'  },
  { id: 'INV-002', name: 'Atlantic Salmon',    category: 'Proteins',  unit: 'kg',  stock: 2.1,  min: 3,   cost: 42.00, supplier: 'Ocean Fresh'     },
  { id: 'INV-003', name: 'Ribeye Steak',       category: 'Proteins',  unit: 'kg',  stock: 8.5,  min: 4,   cost: 72.00, supplier: 'Prime Cuts Co.'  },
  { id: 'INV-004', name: 'Black Truffle',      category: 'Produce',   unit: 'g',   stock: 120,  min: 200, cost: 3.20,  supplier: 'Gourmet Imports' },
  { id: 'INV-005', name: 'Avocado',            category: 'Produce',   unit: 'pcs', stock: 24,   min: 10,  cost: 1.20,  supplier: 'Fresh Farms'     },
  { id: 'INV-006', name: 'Burrata',            category: 'Dairy',     unit: 'pcs', stock: 0,    min: 6,   cost: 4.50,  supplier: 'Artisan Dairy'   },
  { id: 'INV-007', name: 'Parmesan',           category: 'Dairy',     unit: 'kg',  stock: 3.8,  min: 2,   cost: 18.00, supplier: 'Artisan Dairy'   },
  { id: 'INV-008', name: 'Pasta (Tagliatelle)',category: 'Dry Goods', unit: 'kg',  stock: 12,   min: 5,   cost: 3.50,  supplier: 'Italian Pantry'  },
  { id: 'INV-009', name: 'Cabernet Sauvignon', category: 'Beverages', unit: 'btl', stock: 18,   min: 12,  cost: 22.00, supplier: 'Vine & Co.'      },
  { id: 'INV-010', name: 'Craft Lager Keg',    category: 'Beverages', unit: 'keg', stock: 1,    min: 2,   cost: 95.00, supplier: 'Local Brew'      },
  { id: 'INV-011', name: 'Espresso Beans',     category: 'Dry Goods', unit: 'kg',  stock: 5.5,  min: 3,   cost: 28.00, supplier: 'Bean Origin'     },
  { id: 'INV-012', name: 'Heavy Cream',        category: 'Dairy',     unit: 'L',   stock: 6,    min: 4,   cost: 3.80,  supplier: 'Artisan Dairy'   },
];

export const BLANK_INVENTORY_ITEM: Omit<InventoryItem, 'id'> = { name: '', category: 'Proteins', unit: 'kg', stock: 0, min: 0, cost: 0, supplier: '' };
