import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { flushSync } from 'react-dom';
import type {
  InventoryItem,
  InventoryUsage,
  MenuItem,
  Order,
  OrderItem,
  PlaceOrderInput,
  PosStateV1,
  Promotion,
  Recipe,
  RecipeIngredient,
  ServiceChannel,
  Vendor,
} from './types';
import { POS_SEED_V1 } from './seed';
import { convertQty } from './units';
import { isDishCategory } from './constants';
import { computeOrderPricing } from './promotionPricing';

const STORAGE_KEY = 'restaurant-pos.pos.v1';

/** Sentinel: if still present after dispatch, the reducer did not fill `resultRef` (should not happen). */
const PLACE_RESULT_PENDING = '__RESTAURANT_POS_PLACE_PENDING__';

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function round6(n: number) {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function parseServiceChannel(raw: unknown): ServiceChannel {
  const s = String(raw ?? '').trim();
  if (s === 'takeaway' || s === 'delivery') return s;
  return 'dine_in';
}

function receiptTableLabel(input: PlaceOrderInput, channel: ServiceChannel): string {
  if (channel === 'dine_in') return String(input.table ?? '').trim() || 'Dine-in';
  if (channel === 'takeaway') {
    const n = (input.customerName ?? '').trim();
    return n ? `Takeaway · ${n}` : 'Takeaway';
  }
  const n = (input.customerName ?? '').trim();
  return n ? `Delivery · ${n}` : 'Delivery';
}

function normalizePromotion(raw: any): Promotion | null {
  const id = String(raw?.id ?? '').trim();
  const name = String(raw?.name ?? '').trim();
  if (!id || !name) return null;
  const description = typeof raw.description === 'string' ? raw.description : '';
  const active = raw.active !== false;
  const kind = raw?.kind;
  if (kind === 'percent_off') {
    const percent = Number(raw.percent);
    if (!Number.isFinite(percent)) return null;
    return { id, name, description, active, kind: 'percent_off', percent: Math.min(100, Math.max(0, percent)) };
  }
  if (kind === 'fixed_off_order') {
    const fixedAmount = Number(raw.fixedAmount);
    if (!Number.isFinite(fixedAmount) || fixedAmount < 0) return null;
    return { id, name, description, active, kind: 'fixed_off_order', fixedAmount };
  }
  if (kind === 'bogo_menu_item') {
    const bogoMenuItemId = String(raw.bogoMenuItemId ?? '').trim();
    if (!bogoMenuItemId) return null;
    return { id, name, description, active, kind: 'bogo_menu_item', bogoMenuItemId };
  }
  if (kind === 'package_deal') {
    const rawLines = Array.isArray(raw.lines) ? raw.lines : [];
    const lines = rawLines
      .map((ln: any) => {
        const menuItemId = String(ln?.menuItemId ?? '').trim();
        const q = Math.floor(Number(ln?.qty));
        const qty = Number.isFinite(q) && q >= 1 ? q : 0;
        return { menuItemId, qty };
      })
      .filter((ln: { menuItemId: string; qty: number }) => ln.menuItemId && ln.qty >= 1);
    const bundlePrice = Number(raw.bundlePrice);
    if (lines.length < 3 || lines.length > 4 || !Number.isFinite(bundlePrice) || bundlePrice < 0) return null;
    const ids = new Set(lines.map((l: { menuItemId: string }) => l.menuItemId));
    if (ids.size !== lines.length) return null;
    return { id, name, description, active, kind: 'package_deal', lines, bundlePrice };
  }
  return null;
}

function normalizeOrderItem(raw: any): OrderItem | null {
  const menuItemId = String(raw?.menuItemId ?? '').trim();
  const nameSnapshot = String(raw?.nameSnapshot ?? '').trim();
  if (!menuItemId || !nameSnapshot) return null;
  const priceSnapshot = Number(raw?.priceSnapshot);
  const qty = Math.floor(Number(raw?.qty));
  if (!Number.isFinite(priceSnapshot) || qty <= 0) return null;
  return { menuItemId, nameSnapshot, priceSnapshot, qty };
}

function normalizeOrder(raw: any): Order | null {
  const id = String(raw?.id ?? '').trim();
  if (!id) return null;
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .map(normalizeOrderItem)
    .filter((it): it is OrderItem => it !== null);
  const subtotal = Number(raw.subtotal);
  const tax = Number(raw.tax);
  const total = Number(raw.total);
  if (!Number.isFinite(subtotal) || !Number.isFinite(tax) || !Number.isFinite(total)) return null;

  const legacy = raw.grossSubtotal == null || raw.discountTotal == null;
  const grossSubtotal = legacy ? round2(subtotal) : round2(Number(raw.grossSubtotal));
  const discountTotal = legacy ? 0 : round2(Number(raw.discountTotal));
  const subtotalFinal = legacy ? round2(subtotal) : round2(Number(raw.subtotal));

  const promotionId = raw.promotionId != null ? String(raw.promotionId) : null;
  const promotionName = raw.promotionName != null ? String(raw.promotionName) : null;
  const serviceChannel = parseServiceChannel(raw.serviceChannel);
  const customerName = raw.customerName != null && String(raw.customerName).trim() ? String(raw.customerName).trim() : null;
  const customerPhone = raw.customerPhone != null && String(raw.customerPhone).trim() ? String(raw.customerPhone).trim() : null;
  const deliveryAddress =
    raw.deliveryAddress != null && String(raw.deliveryAddress).trim() ? String(raw.deliveryAddress).trim() : null;
  const deliveryNotes =
    raw.deliveryNotes != null && String(raw.deliveryNotes).trim() ? String(raw.deliveryNotes).trim() : null;

  return {
    id,
    createdAtIso: typeof raw.createdAtIso === 'string' ? raw.createdAtIso : new Date().toISOString(),
    table: String(raw.table ?? ''),
    paymentMethod: String(raw.paymentMethod ?? ''),
    items,
    grossSubtotal,
    discountTotal,
    subtotal: subtotalFinal,
    tax: round2(tax),
    total: round2(total),
    promotionId,
    promotionName,
    serviceChannel,
    customerName,
    customerPhone,
    deliveryAddress,
    deliveryNotes,
  };
}

function normalizeVendor(raw: any): Vendor | null {
  const id = String(raw?.id ?? '').trim();
  const name = String(raw?.name ?? '').trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    contactName: typeof raw.contactName === 'string' ? raw.contactName : '',
    email: typeof raw.email === 'string' ? raw.email : '',
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    address: typeof raw.address === 'string' ? raw.address : '',
    accountNumber: typeof raw.accountNumber === 'string' ? raw.accountNumber : '',
    paymentTerms: typeof raw.paymentTerms === 'string' ? raw.paymentTerms : '',
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    active: raw.active !== false,
  };
}

function loadState(): PosStateV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return POS_SEED_V1;
    const parsed = JSON.parse(raw) as PosStateV1;
    if (!parsed || parsed.version !== 1) return POS_SEED_V1;
    // Migrate older persisted inventory rows (missing dish fields)
    const inventory = (parsed.inventory ?? []).map((inv: any) => {
      const dishCategory = isDishCategory(String(inv.dishCategory ?? '')) ? inv.dishCategory : 'General';
      const dishName = typeof inv.dishName === 'string' ? inv.dishName : '';
      return { ...inv, dishCategory, dishName };
    });
    const vendors = Array.isArray((parsed as any).vendors)
      ? ((parsed as any).vendors as any[]).map(normalizeVendor).filter((v): v is Vendor => v !== null)
      : [];
    const promotions = Array.isArray((parsed as any).promotions)
      ? ((parsed as any).promotions as any[]).map(normalizePromotion).filter((p): p is Promotion => p !== null)
      : POS_SEED_V1.promotions;
    const orders = Array.isArray(parsed.orders)
      ? (parsed.orders as any[]).map(normalizeOrder).filter((o): o is Order => o !== null)
      : [];
    const p = parsed as any;
    const recipes = Array.isArray(p.recipes) ? p.recipes : POS_SEED_V1.recipes;
    const menu = Array.isArray(p.menu) ? p.menu : POS_SEED_V1.menu;
    const usage = Array.isArray(p.usage) ? p.usage : [];
    return { version: 1, inventory, recipes, menu, orders, usage, vendors, promotions };
  } catch {
    return POS_SEED_V1;
  }
}

function saveState(state: PosStateV1) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function byId<T extends { id: string }>(rows: T[]): Record<string, T> {
  return Object.fromEntries(rows.map(r => [r.id, r]));
}

type PlaceOrderOk = { ok: true; order: Order };
type PlaceOrderErr = { ok: false; reason: string; details?: any };

type PosActions = {
  inventory: {
    upsert: (item: InventoryItem) => void;
    remove: (id: string) => void;
  };
  vendors: {
    upsert: (item: Vendor) => void;
    remove: (id: string) => void;
  };
  recipes: {
    upsert: (recipe: Recipe) => void;
    remove: (id: string) => void;
  };
  menu: {
    upsert: (item: MenuItem) => void;
    remove: (id: string) => void;
  };
  promotions: {
    upsert: (item: Promotion) => void;
    remove: (id: string) => void;
  };
  orders: {
    place: (input: PlaceOrderInput) => PlaceOrderOk | PlaceOrderErr;
  };
  system: {
    reset: () => void;
  };
};

type PosContextValue = {
  state: PosStateV1;
  actions: PosActions;
};

type Action =
  | { type: 'inventory.upsert'; item: InventoryItem }
  | { type: 'inventory.remove'; id: string }
  | { type: 'vendors.upsert'; item: Vendor }
  | { type: 'vendors.remove'; id: string }
  | { type: 'recipes.upsert'; recipe: Recipe }
  | { type: 'recipes.remove'; id: string }
  | { type: 'menu.upsert'; item: MenuItem }
  | { type: 'menu.remove'; id: string }
  | { type: 'promotions.upsert'; item: Promotion }
  | { type: 'promotions.remove'; id: string }
  | { type: 'orders.place'; input: PlaceOrderInput; resultRef: { current: PlaceOrderOk | PlaceOrderErr } }
  | { type: 'system.reset' };

function validateRecipeIngredients(ings: RecipeIngredient[], invBy: Record<string, InventoryItem>): string | null {
  if (ings.length === 0) return 'Recipe must have at least 1 ingredient.';
  for (const ing of ings) {
    const inv = invBy[ing.inventoryId];
    if (!inv) return `Recipe references missing inventory item: ${ing.inventoryId}`;
    if (ing.qty <= 0) return 'Ingredient quantity must be > 0.';
    // unit conversion validated at runtime in convertQty
    try {
      convertQty(ing.qty, ing.unit, inv.unit);
    } catch (e: any) {
      return e?.message ?? 'Invalid ingredient unit.';
    }
  }
  return null;
}

function reducer(state: PosStateV1, action: Action): PosStateV1 {
  switch (action.type) {
    case 'system.reset': {
      return POS_SEED_V1;
    }

    case 'inventory.upsert': {
      const next = state.inventory.some(i => i.id === action.item.id)
        ? state.inventory.map(i => (i.id === action.item.id ? action.item : i))
        : [action.item, ...state.inventory];
      return { ...state, inventory: next };
    }

    case 'inventory.remove': {
      const invInUse = state.recipes.some(r => r.ingredients.some(ing => ing.inventoryId === action.id));
      if (invInUse) return state;
      return { ...state, inventory: state.inventory.filter(i => i.id !== action.id) };
    }

    case 'vendors.upsert': {
      const vendors = state.vendors ?? [];
      const next = vendors.some(v => v.id === action.item.id)
        ? vendors.map(v => (v.id === action.item.id ? action.item : v))
        : [action.item, ...vendors];
      return { ...state, vendors: next };
    }

    case 'vendors.remove': {
      const vendors = state.vendors ?? [];
      return { ...state, vendors: vendors.filter(v => v.id !== action.id) };
    }

    case 'recipes.upsert': {
      const invBy = byId(state.inventory);
      const err = validateRecipeIngredients(action.recipe.ingredients, invBy);
      if (err) return state;

      const next = state.recipes.some(r => r.id === action.recipe.id)
        ? state.recipes.map(r => (r.id === action.recipe.id ? action.recipe : r))
        : [action.recipe, ...state.recipes];

      // Auto-sync: Recipe → Menu (create or update menu item for this recipe)
      const existingMenuForRecipe = state.menu.find(m => m.recipeId === action.recipe.id);
      const nextMenu = (() => {
        if (existingMenuForRecipe) {
          return state.menu.map(m => {
            if (m.recipeId !== action.recipe.id) return m;
            return { ...m, name: action.recipe.name, category: action.recipe.category };
          });
        }
        const autoId = `MENU-AUTO-${action.recipe.id}`;
        return [{
          id: autoId,
          name: action.recipe.name,
          category: action.recipe.category,
          price: 0,
          recipeId: action.recipe.id,
          image: '',
        }, ...state.menu];
      })();

      return { ...state, recipes: next, menu: nextMenu };
    }

    case 'recipes.remove': {
      // Remove menu items linked to this recipe, then remove recipe
      const nextMenu = state.menu.filter(m => m.recipeId !== action.id);
      const nextRecipes = state.recipes.filter(r => r.id !== action.id);
      return { ...state, recipes: nextRecipes, menu: nextMenu };
    }

    case 'menu.upsert': {
      const recipeExists = state.recipes.some(r => r.id === action.item.recipeId);
      if (!recipeExists) return state; // no manual menu items without recipes
      const next = state.menu.some(m => m.id === action.item.id)
        ? state.menu.map(m => (m.id === action.item.id ? action.item : m))
        : [action.item, ...state.menu];
      return { ...state, menu: next };
    }

    case 'menu.remove': {
      return { ...state, menu: state.menu.filter(m => m.id !== action.id) };
    }

    case 'promotions.upsert': {
      const next = state.promotions.some(p => p.id === action.item.id)
        ? state.promotions.map(p => (p.id === action.item.id ? action.item : p))
        : [action.item, ...state.promotions];
      return { ...state, promotions: next };
    }

    case 'promotions.remove': {
      return { ...state, promotions: state.promotions.filter(p => p.id !== action.id) };
    }

    case 'orders.place': {
      try {
      const invBy = byId(state.inventory ?? []);
      const menuBy = byId(state.menu ?? []);
      const recipeBy = byId(state.recipes ?? []);
      const promoBy = byId(state.promotions ?? []);

      const items = action.input.items
        .filter(it => it.qty > 0)
        .map(it => ({ ...it, qty: Math.floor(it.qty) }));
      if (items.length === 0) {
        action.resultRef.current = { ok: false, reason: 'Empty order.' };
        return state;
      }

      const channel = parseServiceChannel(action.input.serviceChannel);
      const custName = (action.input.customerName ?? '').trim();
      const custPhone = (action.input.customerPhone ?? '').trim();
      const delAddr = (action.input.deliveryAddress ?? '').trim();
      const delNotes = (action.input.deliveryNotes ?? '').trim();

      if (channel === 'dine_in' && !String(action.input.table ?? '').trim()) {
        action.resultRef.current = { ok: false, reason: 'Choose a table for dine-in.' };
        return state;
      }
      if (channel === 'takeaway' && !custName) {
        action.resultRef.current = { ok: false, reason: 'Enter pickup name for takeaway.' };
        return state;
      }
      if (channel === 'delivery') {
        if (!delAddr) {
          action.resultRef.current = { ok: false, reason: 'Enter delivery address.' };
          return state;
        }
        if (!custPhone) {
          action.resultRef.current = { ok: false, reason: 'Enter customer phone for delivery.' };
          return state;
        }
      }

      // Aggregate requirements by inventoryId in inventory's unit
      const required: Record<string, number> = {};
      const reqUnit: Record<string, InventoryItem['unit']> = {};

      for (const it of items) {
        const menuItem = menuBy[it.menuItemId];
        if (!menuItem) {
          action.resultRef.current = { ok: false, reason: `Unknown menu item: ${it.menuItemId}` };
          return state;
        }
        const recipe = recipeBy[menuItem.recipeId];
        if (!recipe) {
          action.resultRef.current = { ok: false, reason: `Menu item missing recipe: ${menuItem.name}` };
          return state;
        }
        const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        if (ings.length === 0) {
          action.resultRef.current = {
            ok: false,
            reason: `Recipe "${recipe.name}" has no ingredients. Fix it in Recipes or reset POS data.`,
          };
          return state;
        }
        for (const ing of ings) {
          const inv = invBy[ing.inventoryId];
          if (!inv) {
            action.resultRef.current = { ok: false, reason: `Recipe references missing inventory: ${ing.inventoryId}` };
            return state;
          }
          let needInInvUnit: number;
          try {
            needInInvUnit = convertQty(ing.qty, ing.unit, inv.unit);
          } catch (e: any) {
            action.resultRef.current = { ok: false, reason: e?.message ?? 'Unit conversion failed.' };
            return state;
          }
          const totalNeed = needInInvUnit * it.qty;
          required[inv.id] = (required[inv.id] ?? 0) + totalNeed;
          reqUnit[inv.id] = inv.unit;
        }
      }

      // Check stock (prevent negative stock)
      const insufficient: Array<{ inventoryId: string; name: string; have: number; need: number; unit: string }> = [];
      for (const [invId, need] of Object.entries(required)) {
        const inv = invBy[invId];
        if (!inv) continue;
        const have = Number(inv.quantity);
        if (!Number.isFinite(have) || have + 1e-9 < need) {
          insufficient.push({ inventoryId: invId, name: inv.name, have: Number.isFinite(have) ? have : 0, need, unit: inv.unit });
        }
      }
      if (insufficient.length > 0) {
        action.resultRef.current = { ok: false, reason: 'Insufficient inventory.', details: { insufficient } };
        return state;
      }

      // Deduct atomically
      const nextInventory = (state.inventory ?? []).map(inv => {
        const need = required[inv.id] ?? 0;
        if (!need) return inv;
        const nextQty = round6(inv.quantity - need);
        return { ...inv, quantity: nextQty < 0 ? 0 : nextQty };
      });

      const orderId = uid('ORD');
      const taxRate = action.input.taxRate ?? 0.1;
      const fullItems = items.map(it => {
        const mi = menuBy[it.menuItemId]!;
        return { menuItemId: it.menuItemId, nameSnapshot: mi.name, priceSnapshot: mi.price, qty: it.qty };
      });

      let appliedPromo: Promotion | null = null;
      if (action.input.promotionId) {
        const cand = promoBy[action.input.promotionId];
        if (cand?.active) appliedPromo = cand;
      }
      const pricing = computeOrderPricing(items, menuBy, taxRate, appliedPromo);

      const order: Order = {
        id: orderId,
        createdAtIso: new Date().toISOString(),
        table: receiptTableLabel(action.input, channel),
        paymentMethod: action.input.paymentMethod,
        items: fullItems,
        grossSubtotal: pricing.grossSubtotal,
        discountTotal: pricing.discountTotal,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
        promotionId: appliedPromo?.id ?? null,
        promotionName: appliedPromo?.name ?? null,
        serviceChannel: channel,
        customerName: channel === 'dine_in' ? null : custName || null,
        customerPhone: custPhone || null,
        deliveryAddress: channel === 'delivery' ? delAddr || null : null,
        deliveryNotes: channel === 'delivery' && delNotes ? delNotes : null,
      };

      const usageRows: InventoryUsage[] = Object.entries(required).map(([invId, qty]) => ({
        id: uid('USE'),
        createdAtIso: order.createdAtIso,
        orderId,
        inventoryId: invId,
        quantity: round6(qty),
        unit: reqUnit[invId]!,
      }));

      const nextState: PosStateV1 = {
        ...state,
        inventory: nextInventory,
        orders: [order, ...(state.orders ?? [])],
        usage: [...usageRows, ...(state.usage ?? [])],
      };

      action.resultRef.current = { ok: true, order };
      return nextState;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        action.resultRef.current = { ok: false, reason: msg || 'Could not complete sale.' };
        return state;
      }
    }

    default:
      return state;
  }
}

const PosContext = createContext<PosContextValue | null>(null);

export function PosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const actions: PosActions = useMemo(() => ({
    inventory: {
      upsert: (item) => dispatch({ type: 'inventory.upsert', item }),
      remove: (id) => dispatch({ type: 'inventory.remove', id }),
    },
    vendors: {
      upsert: (item) => dispatch({ type: 'vendors.upsert', item }),
      remove: (id) => dispatch({ type: 'vendors.remove', id }),
    },
    recipes: {
      upsert: (recipe) => dispatch({ type: 'recipes.upsert', recipe }),
      remove: (id) => dispatch({ type: 'recipes.remove', id }),
    },
    menu: {
      upsert: (item) => dispatch({ type: 'menu.upsert', item }),
      remove: (id) => dispatch({ type: 'menu.remove', id }),
    },
    promotions: {
      upsert: (item) => dispatch({ type: 'promotions.upsert', item }),
      remove: (id) => dispatch({ type: 'promotions.remove', id }),
    },
    orders: {
      place: (input) => {
        const resultRef: { current: PlaceOrderOk | PlaceOrderErr } = {
          current: { ok: false, reason: PLACE_RESULT_PENDING },
        };
        flushSync(() => {
          dispatch({ type: 'orders.place', input, resultRef });
        });
        const out = resultRef.current;
        if (out.ok === false && out.reason === PLACE_RESULT_PENDING) {
          return {
            ok: false,
            reason:
              'The register did not confirm this sale. Please try again. If it keeps happening, reload the app or reset POS data in Settings.',
          };
        }
        return out;
      },
    },
    system: {
      reset: () => dispatch({ type: 'system.reset' }),
    },
  }), [dispatch]);

  const value: PosContextValue = useMemo(() => ({ state, actions }), [state, actions]);
  return <PosContext.Provider value={value}>{children}</PosContext.Provider>;
}

export function usePos() {
  const ctx = useContext(PosContext);
  if (!ctx) throw new Error('usePos must be used within PosProvider');
  return ctx;
}

