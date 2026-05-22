export const DISH_CATEGORIES = [
  'Pizza',
  'Burger',
  'Desi Foods',
  'BBQ',
  'Chinese',
  'Drinks',
  'Desserts',
  'General',
] as const;

export type DishCategory = typeof DISH_CATEGORIES[number];

export function isDishCategory(v: string): v is DishCategory {
  return (DISH_CATEGORIES as readonly string[]).includes(v);
}

