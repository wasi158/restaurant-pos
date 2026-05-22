import type { InventoryItem, MenuItem, PosStateV1, Recipe } from './types';
import { convertQty } from './units';

export type MenuAvailability = 'in_stock' | 'low_stock' | 'out_of_stock';

export function byId<T extends { id: string }>(rows: T[]): Record<string, T> {
  return Object.fromEntries(rows.map(r => [r.id, r]));
}

function recipeIngredients(recipe: Recipe) {
  return Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
}

export function recipeCost(recipe: Recipe, invById: Record<string, InventoryItem>): number {
  return recipeIngredients(recipe).reduce((sum, ing) => {
    const inv = invById[ing.inventoryId];
    if (!inv) return sum;
    const qtyInInvUnit = convertQty(ing.qty, ing.unit, inv.unit);
    return sum + qtyInInvUnit * inv.costPerUnit;
  }, 0);
}

export function maxServings(recipe: Recipe, invById: Record<string, InventoryItem>): number {
  let limit = Number.POSITIVE_INFINITY;
  for (const ing of recipeIngredients(recipe)) {
    const inv = invById[ing.inventoryId];
    if (!inv) return 0;
    const need = convertQty(ing.qty, ing.unit, inv.unit);
    if (need <= 0) continue;
    limit = Math.min(limit, inv.quantity / need);
  }
  if (!Number.isFinite(limit)) return 0;
  return Math.floor(limit + 1e-9);
}

export function menuItemAvailability(state: PosStateV1, item: MenuItem): MenuAvailability {
  const invBy = byId(state.inventory);
  const recBy = byId(state.recipes);
  const recipe = recBy[item.recipeId];
  if (!recipe) return 'out_of_stock';
  const servings = maxServings(recipe, invBy);
  if (servings <= 0) return 'out_of_stock';

  // "low" if any ingredient is below minLevel OR only few servings possible.
  const anyBelowMin = recipeIngredients(recipe).some(ing => {
    const inv = invBy[ing.inventoryId];
    if (!inv) return true;
    return inv.quantity < inv.minLevel;
  });
  if (anyBelowMin || servings <= 3) return 'low_stock';
  return 'in_stock';
}

