import { useCallback, useMemo, useState } from 'react';
import {
  addCustomCategory,
  buildDishCategories,
  buildInventoryCategories,
  buildMenuCategories,
  type CategoryListKind,
} from '../lib/pos/categoryLists';
import type { InventoryItem, MenuItem, Recipe } from '../lib/pos/types';

function useCategoryList(kind: CategoryListKind, build: () => string[], deps: unknown[]) {
  const [tick, setTick] = useState(0);

  const categories = useMemo(() => build(), [...deps, tick]);

  const addCategory = useCallback(
    (name: string) => {
      const result = addCustomCategory(kind, name);
      if (result.ok) setTick(t => t + 1);
      return result;
    },
    [kind],
  );

  return { categories, addCategory };
}

export function useMenuCategories(menu: MenuItem[]) {
  return useCategoryList('menu', () => buildMenuCategories(menu), [menu]);
}

export function useInventoryCategories(inventory: InventoryItem[]) {
  return useCategoryList('inventory', () => buildInventoryCategories(inventory), [inventory]);
}

export function useDishCategories(recipes: Recipe[], inventory: InventoryItem[]) {
  return useCategoryList('dish', () => buildDishCategories(recipes, inventory), [recipes, inventory]);
}
