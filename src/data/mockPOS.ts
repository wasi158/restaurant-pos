import {
  Beef, Fish, Salad, Wine, Beer, CupSoda, Cake, Cookie,
  Sandwich, Soup, Pizza, Egg,
} from 'lucide-react';
import React from 'react';

export type POSMenuItem = {
  id: number; name: string; price: number; category: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
};

export const POS_CATEGORIES = ['All', 'Mains', 'Starters', 'Drinks', 'Desserts'];

export const INITIAL_POS_ITEMS: POSMenuItem[] = [
  { id: 1,  name: 'Wagyu Burger',       price: 28.00, category: 'Mains',    icon: Sandwich, iconBg: 'bg-amber-500/15',  iconColor: 'text-amber-500'  },
  { id: 2,  name: 'Truffle Pasta',      price: 24.50, category: 'Mains',    icon: Soup,     iconBg: 'bg-yellow-500/15', iconColor: 'text-yellow-500' },
  { id: 3,  name: 'Miso Cod',           price: 32.00, category: 'Mains',    icon: Fish,     iconBg: 'bg-sky-500/15',    iconColor: 'text-sky-500'    },
  { id: 4,  name: 'Ribeye Steak',       price: 52.00, category: 'Mains',    icon: Beef,     iconBg: 'bg-red-500/15',    iconColor: 'text-red-500'    },
  { id: 5,  name: 'Burrata Salad',      price: 16.00, category: 'Starters', icon: Salad,    iconBg: 'bg-green-500/15',  iconColor: 'text-green-500'  },
  { id: 6,  name: 'Tuna Tartare',       price: 18.50, category: 'Starters', icon: Fish,     iconBg: 'bg-cyan-500/15',   iconColor: 'text-cyan-500'   },
  { id: 7,  name: 'Truffle Fries',      price: 9.00,  category: 'Starters', icon: Pizza,    iconBg: 'bg-orange-500/15', iconColor: 'text-orange-500' },
  { id: 8,  name: 'Burrata Toast',      price: 12.00, category: 'Starters', icon: Egg,      iconBg: 'bg-lime-500/15',   iconColor: 'text-lime-500'   },
  { id: 9,  name: 'Cabernet Sauvignon', price: 14.00, category: 'Drinks',   icon: Wine,     iconBg: 'bg-rose-500/15',   iconColor: 'text-rose-500'   },
  { id: 10, name: 'Craft Lager',        price: 8.00,  category: 'Drinks',   icon: Beer,     iconBg: 'bg-amber-400/15',  iconColor: 'text-amber-400'  },
  { id: 11, name: 'Espresso Martini',   price: 13.00, category: 'Drinks',   icon: CupSoda,  iconBg: 'bg-purple-500/15', iconColor: 'text-purple-500' },
  { id: 12, name: 'Lava Cake',          price: 12.00, category: 'Desserts', icon: Cake,     iconBg: 'bg-pink-500/15',   iconColor: 'text-pink-500'   },
  { id: 13, name: 'Crème Brûlée',       price: 11.00, category: 'Desserts', icon: Cookie,   iconBg: 'bg-yellow-600/15', iconColor: 'text-yellow-600' },
];
