import menuData from '../../mock/menu.json';
import inventoryData from '../../mock/inventory.json';
import { DISH_CATEGORIES } from './constants';
import type { InventoryItem, MenuItem, Recipe } from './types';

export type CategoryListKind = 'menu' | 'inventory' | 'dish';

const STORAGE_KEYS: Record<CategoryListKind, string> = {
  menu: 'pos-custom-menu-categories',
  inventory: 'pos-custom-inventory-categories',
  dish: 'pos-custom-dish-categories',
};

const BASE_SEED: Record<CategoryListKind, string[]> = {
  menu: [...menuData.categories],
  inventory: [...inventoryData.categories],
  dish: [...DISH_CATEGORIES],
};

export function normalizeCategoryName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name || name.length > 48) return null;
  if (name.toLowerCase() === 'all') return null;
  return name;
}

function loadCustom(kind: CategoryListKind): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[kind]);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string' && normalizeCategoryName(x) != null);
  } catch {
    return [];
  }
}

function saveCustom(kind: CategoryListKind, list: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS[kind], JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function uniqueSorted(names: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const n of names) {
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function mergeCategoryLists(...groups: string[][]): string[] {
  return uniqueSorted(groups.flat());
}

export function getCustomCategories(kind: CategoryListKind): string[] {
  return loadCustom(kind);
}

export function addCustomCategory(kind: CategoryListKind, rawName: string): { ok: true; name: string } | { ok: false; reason: string } {
  const name = normalizeCategoryName(rawName);
  if (!name) return { ok: false, reason: 'Enter a valid category name.' };

  const custom = loadCustom(kind);
  if (custom.some(c => c.toLowerCase() === name.toLowerCase())) {
    return { ok: false, reason: 'This category already exists.' };
  }
  if (BASE_SEED[kind].some(c => c.toLowerCase() === name.toLowerCase())) {
    return { ok: false, reason: 'This category already exists.' };
  }

  saveCustom(kind, [...custom, name]);
  return { ok: true, name };
}

export function buildMenuCategories(menu: MenuItem[]): string[] {
  return mergeCategoryLists(
    BASE_SEED.menu,
    getCustomCategories('menu'),
    menu.map(m => m.category),
  );
}

export function buildInventoryCategories(inventory: InventoryItem[]): string[] {
  return mergeCategoryLists(
    BASE_SEED.inventory,
    getCustomCategories('inventory'),
    inventory.map(i => i.category),
  );
}

export function buildDishCategories(recipes: Recipe[], inventory: InventoryItem[]): string[] {
  return mergeCategoryLists(
    BASE_SEED.dish,
    getCustomCategories('dish'),
    recipes.map(r => r.category),
    inventory.map(i => i.dishCategory),
  );
}
