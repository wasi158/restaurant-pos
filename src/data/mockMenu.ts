export type MenuStatus = 'In Stock' | 'Low Stock' | 'Out of Stock';

export type MenuItem = {
  id: string; name: string; category: string; price: number;
  status: MenuStatus; ingredients: string; image: string;
};

export const MENU_CATEGORIES = ['Main Course', 'Starters', 'Pizza', 'Brunch', 'Steaks', 'Desserts', 'Drinks'];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  { id: 'MENU-882', name: 'Smoked Salmon Bowl',    category: 'Main Course', price: 24.50, status: 'In Stock',     ingredients: 'Salmon, Avocado, Quinoa',    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=80&h=80' },
  { id: 'MENU-741', name: 'Truffle Wild Mushroom', category: 'Pizza',       price: 19.00, status: 'In Stock',     ingredients: 'Mushrooms, Truffle Oil',      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=80&h=80' },
  { id: 'MENU-102', name: 'Blueberry Ricotta Stack',category: 'Brunch',     price: 16.50, status: 'Out of Stock', ingredients: 'Flour, Ricotta, Blueberry',   image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&q=80&w=80&h=80' },
  { id: 'MENU-992', name: 'Miso Glazed Wagyu',     category: 'Steaks',      price: 52.00, status: 'Low Stock',    ingredients: 'Wagyu Beef, Miso, Sesame',   image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=80&h=80' },
  { id: 'MENU-331', name: 'Burrata Salad',         category: 'Starters',    price: 16.00, status: 'In Stock',     ingredients: 'Burrata, Tomato, Basil',     image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&q=80&w=80&h=80' },
  { id: 'MENU-554', name: 'Lava Cake',             category: 'Desserts',    price: 12.00, status: 'In Stock',     ingredients: 'Chocolate, Butter, Eggs',    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&q=80&w=80&h=80' },
];

export const BLANK_MENU_ITEM: Omit<MenuItem, 'id'> = { name: '', category: 'Main Course', price: 0, status: 'In Stock', ingredients: '', image: '' };
