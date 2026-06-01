import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Save, ChefHat, Clock, Package, X, Minus, DollarSign } from 'lucide-react';
import { DISH_CATEGORIES, type DishCategory } from '../../lib/pos/constants';
import { Pagination } from '../molecules/Pagination';
import { usePos } from '../../lib/pos/store';
import { useAppSettings } from '../../lib/appSettings';
import type { Recipe, RecipeIngredient, InventoryItem } from '../../lib/pos/types';
import type { Unit } from '../../lib/pos/units';
import { canConvert, convertQty } from '../../lib/pos/units';
import { byId, recipeCost } from '../../lib/pos/selectors';

// ---------- helpers ----------

type IngredientCostLine = {
  inventoryId: string;
  inv: InventoryItem;
  qty: number;
  unit: Unit;
  qtyInInvUnit: number;
  unitCostInRecipeUnit: number;
  lineCost: number;
  allowedUnits: Unit[];
};

const ALL_UNITS: Unit[] = ['kg', 'g', 'L', 'ml', 'pcs'];

function computeIngredientLine(ing: RecipeIngredient, inv: InventoryItem): IngredientCostLine {
  const allowedUnits = ALL_UNITS.filter(u => canConvert(u, inv.unit));

  let qtyInInvUnit = 0;
  try { qtyInInvUnit = ing.qty > 0 ? convertQty(ing.qty, ing.unit, inv.unit) : 0; } catch { /* keep 0 */ }

  let unitCostInRecipeUnit = inv.costPerUnit;
  try {
    const oneInInvUnit = convertQty(1, ing.unit, inv.unit);
    if (oneInInvUnit > 0) unitCostInRecipeUnit = inv.costPerUnit * oneInInvUnit;
  } catch { /* keep base */ }

  return {
    inventoryId: ing.inventoryId,
    inv,
    qty: ing.qty,
    unit: ing.unit,
    qtyInInvUnit,
    unitCostInRecipeUnit,
    lineCost: qtyInInvUnit * inv.costPerUnit,
    allowedUnits,
  };
}

const EMPTY_FORM: Omit<Recipe, 'id'> = {
  name: '', category: 'Burger', prepTime: 10, cookTime: 10, ingredients: [], instructions: '',
};

// ---------- component ----------

export function RecipeBuilderScreen() {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const { recipes, inventory } = state;
  const invById = useMemo(() => byId(inventory), [inventory]);

  const [recipeSearch, setRecipeSearch] = useState('');
  const [pickerQuery, setPickerQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [selected, setSelected] = useState<Recipe | null>(null);
  const [form, setForm] = useState<Omit<Recipe, 'id'>>(EMPTY_FORM);

  // ---------- recipe list ----------

  const filtered = useMemo(() =>
    recipes.filter(r =>
      (categoryFilter === 'All' || r.category === categoryFilter) &&
      r.name.toLowerCase().includes(recipeSearch.toLowerCase())
    ), [recipes, categoryFilter, recipeSearch]);

  useEffect(() => { setCurrentPage(1); }, [recipeSearch, categoryFilter]);
  useEffect(() => { setPickerQuery(''); }, [form.category]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ---------- cost computations (memoised) ----------

  const ingredientLines = useMemo<IngredientCostLine[]>(() =>
    form.ingredients
      .map(ing => {
        const inv = invById[ing.inventoryId];
        if (!inv) return null;
        return computeIngredientLine(ing, inv);
      })
      .filter(Boolean) as IngredientCostLine[],
    [form.ingredients, invById]);

  const totalCost = useMemo(() =>
    ingredientLines.reduce((sum, l) => sum + l.lineCost, 0),
    [ingredientLines]);

  const recipeCostById = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of recipes) map[r.id] = recipeCost(r, invById);
    return map;
  }, [recipes, invById]);

  // ---------- actions ----------

  const handleSelect = useCallback((r: Recipe) => {
    setSelected(r);
    setForm({ name: r.name, category: r.category, prepTime: r.prepTime, cookTime: r.cookTime, ingredients: [...r.ingredients], instructions: r.instructions });
  }, []);

  const handleCreateNew = useCallback(() => {
    setSelected(null);
    setForm({ ...EMPTY_FORM, ingredients: [] });
  }, []);

  const setIngredientQty = useCallback((inventoryId: string, nextQty: number, nextUnit?: Unit) => {
    setForm(prev => {
      const inv = invById[inventoryId];
      if (!inv) return prev;

      const qty = Math.max(0, Number(nextQty) || 0);
      const curr = prev.ingredients.find(i => i.inventoryId === inventoryId);
      const unit: Unit = nextUnit
        ? (canConvert(nextUnit, inv.unit) ? nextUnit : inv.unit)
        : (curr?.unit && canConvert(curr.unit as Unit, inv.unit) ? (curr.unit as Unit) : inv.unit);

      const others = prev.ingredients.filter(i => i.inventoryId !== inventoryId);
      if (qty <= 0) return { ...prev, ingredients: others };
      return { ...prev, ingredients: [...others, { inventoryId, qty, unit }] };
    });
  }, [invById]);

  const addIngredient = useCallback((inventoryId: string) => {
    const inv = invById[inventoryId];
    if (!inv) return;
    setIngredientQty(inventoryId, 1, inv.unit);
  }, [invById, setIngredientQty]);

  const removeIngredient = useCallback((inventoryId: string) => {
    setForm(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i.inventoryId !== inventoryId) }));
  }, []);

  const handleSave = useCallback(() => {
    if (!form.name.trim() || form.ingredients.length === 0) return;
    if (selected) {
      const updated: Recipe = { ...form, id: selected.id } as Recipe;
      actions.recipes.upsert(updated);
      setSelected(updated);
    } else {
      const newRecipe: Recipe = { ...form, id: `REC-${crypto.randomUUID()}` } as Recipe;
      actions.recipes.upsert(newRecipe);
      setSelected(newRecipe);
    }
  }, [form, selected, actions.recipes]);

  const handleDelete = useCallback(() => {
    if (!selected) return;
    actions.recipes.remove(selected.id);
    handleCreateNew();
  }, [selected, actions.recipes, handleCreateNew]);

  // ---------- picker ----------

  const pickerCandidates = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const addedIds = new Set(form.ingredients.map(i => i.inventoryId));
    const categoryFiltered = inventory.filter(inv => {
      if (addedIds.has(inv.id)) return false;
      if (form.category === 'General') return true;
      return inv.dishCategory === form.category || inv.dishCategory === 'General';
    });
    const sorted = [...categoryFiltered].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(inv =>
      inv.name.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      (inv.dishName ?? '').toLowerCase().includes(q)
    );
  }, [inventory, form.category, form.ingredients, pickerQuery]);

  // ---------- render ----------

  return (
    <div className="flex flex-col lg:flex-row min-h-full overflow-x-hidden">
      {/* ===== Left: Recipe List ===== */}
      <div className="w-full lg:w-[380px] flex flex-col lg:border-r border-b lg:border-b-0 border-outline-variant bg-surface shrink-0 max-h-[40vh] lg:max-h-none">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-black font-headline text-on-surface">Recipes</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{recipes.length} total recipes</p>
            </div>
            <button onClick={handleCreateNew} className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary-container rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input value={recipeSearch} onChange={e => setRecipeSearch(e.target.value)} placeholder="Search recipes..."
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', ...DISH_CATEGORIES].map(c => (
              <button key={c} onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${categoryFilter === c ? 'bg-primary text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:text-on-surface'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-surface-container-lowest">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence>
              {paginatedData.map(r => {
                const cost = recipeCostById[r.id] ?? 0;
                return (
                  <motion.button key={r.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleSelect(r)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === r.id ? 'bg-primary/10 border-primary/40' : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-on-surface">{r.name}</h3>
                      <span className="text-xs font-black text-primary font-mono">{formatMoney(cost)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.prepTime + r.cookTime}m</span>
                      <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" /> {r.ingredients.length} items</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {r.category}</span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && <p className="text-center text-sm text-on-surface-variant py-10">No recipes found.</p>}
          </div>
          {filtered.length > 0 && (
            <div className="border-t border-outline-variant bg-surface pb-2">
              <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
            </div>
          )}
        </div>
      </div>

      {/* ===== Right: Builder ===== */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden">
        {/* Header bar */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-outline-variant shrink-0 bg-surface">
          <div>
            <h2 className="text-xl font-bold font-headline text-on-surface">{selected ? 'Edit Recipe' : 'New Recipe'}</h2>
            <p className="text-sm text-on-surface-variant">{selected ? `Editing ${selected.name}` : 'Create a new dish'}</p>
          </div>
          <div className="flex items-center gap-4">
            {form.ingredients.length > 0 && (
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Recipe Cost</p>
                <p className="text-xl font-black text-primary font-mono">{formatMoney(totalCost)}</p>
              </div>
            )}
            <div className="flex gap-3">
              {selected && (
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-error font-semibold rounded-xl hover:bg-error/10 transition-colors text-sm">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              )}
              <button onClick={handleSave} disabled={!form.name.trim() || form.ingredients.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary-container font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all text-sm disabled:opacity-50 shadow-md">
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">

          {/* General Details + Cost Summary side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant border-b border-outline-variant pb-2">General Details</h3>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Recipe Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wagyu Burger"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as DishCategory }))}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40">
                    {DISH_CATEGORIES.map(c => <option key={c} className="bg-surface text-on-surface">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Prep (mins)</label>
                  <input type="number" min="0" value={form.prepTime} onChange={e => setForm(f => ({ ...f, prepTime: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Cook (mins)</label>
                  <input type="number" min="0" value={form.cookTime} onChange={e => setForm(f => ({ ...f, cookTime: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Instructions</label>
                <textarea value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="1. Chop vegetables...&#10;2. Sear meat..."
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none min-h-[80px]" />
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col">
              <h3 className="font-bold text-sm uppercase tracking-wider text-primary mb-3">Cost to Make</h3>
              <div className="text-center py-4">
                <p className="text-3xl font-black text-primary font-mono">{formatMoney(totalCost)}</p>
                <p className="text-xs text-on-surface-variant mt-1">per serving</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-surface/80 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Items</p>
                  <p className="text-lg font-black text-on-surface">{form.ingredients.length}</p>
                </div>
                <div className="bg-surface/80 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Time</p>
                  <p className="text-lg font-black text-on-surface">{form.prepTime + form.cookTime}m</p>
                </div>
              </div>
              {ingredientLines.length > 0 && (
                <div className="flex-1 space-y-1 pt-3 border-t border-primary/15 overflow-y-auto">
                  {ingredientLines.map(line => (
                    <div key={line.inventoryId} className="flex justify-between text-xs gap-2">
                      <span className="text-on-surface truncate">{line.inv.name}</span>
                      <span className="font-bold text-on-surface font-mono shrink-0">{formatMoney(line.lineCost)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ingredients Table -- full width */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <h3 className="font-bold text-base text-on-surface">Recipe Ingredients</h3>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high border border-outline-variant px-3 py-1 rounded-full">
                {form.ingredients.length} item{form.ingredients.length !== 1 ? 's' : ''}
              </span>
            </div>

            {form.ingredients.length === 0 ? (
              <div className="text-center py-16 px-6 text-on-surface-variant text-sm">
                No ingredients added yet. Use the Quick Add section below to add inventory items.
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container-high text-[10px] font-black uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                      <th className="text-left px-6 py-2.5 font-black">Ingredient</th>
                      <th className="text-left px-4 py-2.5 font-black w-[120px]">Unit Cost</th>
                      <th className="text-center px-4 py-2.5 font-black w-[200px]">Quantity</th>
                      <th className="text-center px-4 py-2.5 font-black w-[70px]">Unit</th>
                      <th className="text-right px-4 py-2.5 font-black w-[110px]">Line Cost</th>
                      <th className="w-10 px-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {ingredientLines.map(line => (
                      <tr key={line.inventoryId} className="hover:bg-primary/[0.03] transition-colors">
                        <td className="px-6 py-3">
                          <p className="text-sm font-bold text-on-surface">{line.inv.name}</p>
                          <p className="text-[11px] text-on-surface-variant">{line.inv.quantity} {line.inv.unit} in stock</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-on-surface">{formatMoney(line.inv.costPerUnit)}</span>
                          <span className="text-[11px] text-on-surface-variant">/{line.inv.unit}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setIngredientQty(line.inventoryId, line.qty - 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-surface-bright transition-colors">
                              <Minus className="w-3.5 h-3.5 text-on-surface" />
                            </button>
                            <input type="number" min="0" step="0.01" value={line.qty}
                              onChange={e => setIngredientQty(line.inventoryId, parseFloat(e.target.value) || 0)}
                              className="w-20 bg-surface border border-outline-variant rounded-lg px-2 py-2 text-sm text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40" />
                            <button onClick={() => setIngredientQty(line.inventoryId, line.qty + 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-outline-variant bg-surface hover:bg-surface-bright transition-colors">
                              <Plus className="w-3.5 h-3.5 text-on-surface" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select value={line.unit} onChange={e => setIngredientQty(line.inventoryId, line.qty, e.target.value as Unit)}
                            className="w-full bg-surface border border-outline-variant rounded-lg px-1.5 py-2 text-xs text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary/40">
                            {line.allowedUnits.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm font-black text-primary font-mono">{formatMoney(line.lineCost)}</p>
                          <p className="text-[10px] text-on-surface-variant font-mono">{line.qty} × {formatMoney(line.unitCostInRecipeUnit)}</p>
                        </td>
                        <td className="px-2 py-3">
                          <button onClick={() => removeIngredient(line.inventoryId)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-error/60 hover:text-error hover:bg-error/10 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between px-6 py-3 bg-primary/5 border-t border-primary/20">
                  <span className="text-sm font-bold text-on-surface">{form.ingredients.length} ingredient{form.ingredients.length !== 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-on-surface-variant">Total Recipe Cost</span>
                    <span className="text-xl font-black text-primary font-mono">{formatMoney(totalCost)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Quick Add from Inventory -- full width */}
          <div className="bg-surface-container-low border border-outline-variant rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
              <div>
                <h3 className="font-bold text-base text-on-surface">Quick Add from Inventory</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Showing <span className="font-semibold text-on-surface">{form.category}</span> category items. Click to add as ingredient.
                </p>
              </div>
              <span className="text-xs font-bold text-on-surface-variant bg-surface-container-high border border-outline-variant px-3 py-1.5 rounded-full">
                {pickerCandidates.length} available
              </span>
            </div>

            <div className="px-6 py-3 border-b border-outline-variant">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
                <input value={pickerQuery} onChange={e => setPickerQuery(e.target.value)} placeholder="Search inventory items..."
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-2.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {pickerCandidates.length === 0 ? (
                <div className="p-8 text-center text-sm text-on-surface-variant">
                  {form.ingredients.length > 0 && inventory.length > 0
                    ? 'All matching inventory items have been added to this recipe.'
                    : 'No inventory items found for this category.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 divide-outline-variant">
                  {pickerCandidates.map(inv => (
                    <button key={inv.id} type="button" onClick={() => addIngredient(inv.id)}
                      className="text-left px-5 py-3.5 hover:bg-primary/5 transition-colors flex items-center gap-3 border-b sm:border-b sm:border-r border-outline-variant">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{inv.name}</p>
                        <p className="text-[11px] text-on-surface-variant">
                          {inv.quantity} {inv.unit} · {formatMoney(inv.costPerUnit)}/{inv.unit}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
