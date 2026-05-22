import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, Save, ChefHat, Clock, Package } from 'lucide-react';
import { DISH_CATEGORIES, type DishCategory } from '../lib/pos/constants';
import { Pagination } from './Pagination';
import { usePos } from '../lib/pos/store';
import { useAppSettings } from '../lib/appSettings';
import type { Recipe, RecipeIngredient } from '../lib/pos/types';
import type { Unit } from '../lib/pos/units';
import { canConvert, convertQty } from '../lib/pos/units';
import { byId, recipeCost } from '../lib/pos/selectors';

export function RecipeBuilderScreen() {
  const { formatMoney } = useAppSettings();
  const { state, actions } = usePos();
  const recipes = state.recipes;
  const inventory = state.inventory;
  const invById = useMemo(() => byId(inventory), [inventory]);
  const [recipeSearch, setRecipeSearch] = useState('');
  const [bomSearch, setBomSearch] = useState('');
  const [pickerQuery, setPickerQuery] = useState('');
  const [includeOtherCategoriesInBom, setIncludeOtherCategoriesInBom] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const [selected, setSelected] = useState<Recipe | null>(null);
  const [form, setForm] = useState<Omit<Recipe, 'id'>>({ name: '', category: 'Burger', prepTime: 10, cookTime: 10, ingredients: [], instructions: '' });

  const filtered = recipes.filter(r =>
    (categoryFilter === 'All' || r.category === categoryFilter) &&
    r.name.toLowerCase().includes(recipeSearch.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [recipeSearch, categoryFilter]);

  useEffect(() => {
    setBomSearch('');
    setPickerQuery('');
    setIncludeOtherCategoriesInBom(false);
  }, [form.category]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedData = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelect = (r: Recipe) => {
    setSelected(r);
    setForm(r);
  };

  const handleCreateNew = () => {
    setSelected(null);
    setForm({ name: '', category: 'Burger', prepTime: 10, cookTime: 10, ingredients: [], instructions: '' });
  };

  const ingredientByInvId = useMemo(() => {
    const m = new Map<string, RecipeIngredient>();
    for (const ing of form.ingredients) m.set(ing.inventoryId, ing);
    return m;
  }, [form.ingredients]);

  const patchInventoryStock = (inventoryId: string, nextQty: number) => {
    const inv = invById[inventoryId];
    if (!inv) return;
    const quantity = Math.max(0, Number(nextQty) || 0);
    actions.inventory.upsert({ ...inv, quantity });
  };

  const setIngredientForInventory = (inventoryId: string, nextQty: number, nextUnit?: Unit) => {
    setForm(prev => {
      const inv = invById[inventoryId];
      if (!inv) return prev;

      const qty = Math.max(0, Number(nextQty) || 0);
      const curr = prev.ingredients.find(i => i.inventoryId === inventoryId);
      const unit: Unit = nextUnit
        ? (canConvert(nextUnit, inv.unit) ? nextUnit : inv.unit)
        : ((curr?.unit && canConvert(curr.unit as Unit, inv.unit) ? (curr.unit as Unit) : inv.unit));

      const others = prev.ingredients.filter(i => i.inventoryId !== inventoryId);
      if (qty <= 0) {
        return { ...prev, ingredients: others };
      }
      return { ...prev, ingredients: [...others, { inventoryId, qty, unit }] };
    });
  };

  const bomMaterials = useMemo(() => {
    const q = bomSearch.trim().toLowerCase();
    const categoryFiltered = inventory.filter(inv => {
      if (form.category === 'General') return true;
      if (includeOtherCategoriesInBom) return true;
      return inv.dishCategory === form.category || inv.dishCategory === 'General';
    });
    const textFiltered = q.length === 0
      ? categoryFiltered
      : categoryFiltered.filter(inv =>
          inv.name.toLowerCase().includes(q) ||
          inv.id.toLowerCase().includes(q) ||
          (inv.dishName ?? '').toLowerCase().includes(q)
        );
    return [...textFiltered].sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, form.category, bomSearch, includeOtherCategoriesInBom]);

  const primaryPickInventory = useMemo(() => {
    return [...bomMaterials].sort((a, b) => a.name.localeCompare(b.name));
  }, [bomMaterials]);

  const secondaryPickInventory = useMemo(() => {
    if (form.category === 'General') return [];
    const primaryIds = new Set(primaryPickInventory.map(i => i.id));
    return inventory
      .filter(inv => !primaryIds.has(inv.id))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [inventory, form.category, primaryPickInventory]);

  const pickerCandidates = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    const base = [...primaryPickInventory, ...secondaryPickInventory];
    const uniq = new Map<string, typeof inventory[number]>();
    for (const inv of base) uniq.set(inv.id, inv);
    const all = [...uniq.values()].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return all;
    return all.filter(inv =>
      inv.name.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      (inv.dishName ?? '').toLowerCase().includes(q) ||
      inv.dishCategory.toLowerCase().includes(q)
    );
  }, [primaryPickInventory, secondaryPickInventory, pickerQuery]);

  const addIngredientFromPicker = (inventoryId: string) => {
    const inv = invById[inventoryId];
    if (!inv) return;
    const existing = form.ingredients.find(i => i.inventoryId === inventoryId);
    if (existing) {
      setIngredientForInventory(inventoryId, existing.qty + 1);
      return;
    }
    setIngredientForInventory(inventoryId, 1, inv.unit);
  };

  const calculateTotalCost = () => recipeCost({ id: 'tmp', ...form } as Recipe, invById);

  const selectedIngredientLines = useMemo(() => form.ingredients.filter(i => i.qty > 0).length, [form.ingredients]);

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (form.ingredients.length === 0) return;
    
    if (selected) {
      const updated: Recipe = { ...form, id: selected.id } as Recipe;
      actions.recipes.upsert(updated);
      setSelected(updated);
    } else {
      const newRecipe: Recipe = { ...form, id: `REC-${crypto.randomUUID()}` } as Recipe;
      actions.recipes.upsert(newRecipe);
      setSelected(newRecipe);
    }
  };

  const handleDelete = () => {
    if (!selected) return;
    actions.recipes.remove(selected.id);
    handleCreateNew();
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left List */}
      <div className="w-[380px] flex flex-col border-r border-outline-variant bg-surface shrink-0">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-black font-headline text-on-surface">Recipes</h1>
              <p className="text-sm text-on-surface-variant mt-0.5">{recipes.length} total recipes</p>
            </div>
            <button 
              onClick={handleCreateNew}
              className="w-10 h-10 flex items-center justify-center bg-primary text-on-primary-container rounded-xl shadow-md hover:brightness-105 active:scale-95 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              value={recipeSearch} 
              onChange={e => setRecipeSearch(e.target.value)}
              placeholder="Search recipes..."
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', ...DISH_CATEGORIES].map(c => (
              <button 
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${categoryFilter === c ? 'bg-primary text-on-primary-container' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant hover:text-on-surface'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-surface-container-lowest">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <AnimatePresence>
              {paginatedData.map(r => (
                <motion.button
                  key={r.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handleSelect(r)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selected?.id === r.id
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-on-surface">{r.name}</h3>
                    <span className="text-[10px] font-mono text-on-surface-variant">{r.id}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.prepTime + r.cookTime}m total</span>
                    <span className="flex items-center gap-1"><ChefHat className="w-3.5 h-3.5" /> {r.ingredients.length} items</span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-on-surface-variant py-10">No recipes found.</p>
            )}
          </div>
          {filtered.length > 0 && (
            <div className="border-t border-outline-variant bg-surface pb-2">
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right Builder */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest overflow-hidden">
        {/* Header */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-outline-variant shrink-0 bg-surface">
          <div>
            <h2 className="text-xl font-bold font-headline text-on-surface">{selected ? 'Edit Recipe' : 'New Recipe'}</h2>
            <p className="text-sm text-on-surface-variant">{selected ? `Editing ${selected.name}` : 'Create a new dish'}</p>
          </div>
          <div className="flex gap-3">
            {selected && (
              <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 border border-outline-variant text-error font-semibold rounded-xl hover:bg-error/10 transition-colors text-sm">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            <button 
              onClick={handleSave}
              disabled={!form.name.trim() || form.ingredients.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-on-primary-container font-bold rounded-xl hover:brightness-105 active:scale-95 transition-all text-sm disabled:opacity-50 shadow-md"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-8 flex flex-col xl:flex-row gap-6 xl:gap-8">
          {/* Main Info */}
          <div className="w-full xl:w-[44%] min-h-0 space-y-6">
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 space-y-5">
              <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant border-b border-outline-variant pb-2">General Details</h3>
              
              <div>
                <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Recipe Name *</label>
                <input 
                  value={form.name} 
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Wagyu Burger"
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Category</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as DishCategory }))}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {DISH_CATEGORIES.map(c => <option key={c} className="bg-surface text-on-surface">{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Prep Time (mins)</label>
                  <input 
                    type="number" min="0" value={form.prepTime} 
                    onChange={e => setForm(f => ({ ...f, prepTime: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">Cook Time (mins)</label>
                  <input 
                    type="number" min="0" value={form.cookTime} 
                    onChange={e => setForm(f => ({ ...f, cookTime: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-6 space-y-4 flex-1 flex flex-col">
              <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant border-b border-outline-variant pb-2">Preparation Instructions</h3>
              <textarea 
                value={form.instructions}
                onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                placeholder="1. Chop vegetables...&#10;2. Sear meat..."
                className="w-full flex-1 bg-surface-container-high border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none min-h-[200px]"
              />
            </div>
          </div>

          {/* Ingredients & Cost */}
          <div className="w-full xl:flex-1 min-h-0 flex flex-col">
            <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-5 sm:p-6 flex flex-col flex-1 min-h-0">
              <div className="border-b border-outline-variant pb-4 mb-4 shrink-0 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-on-surface-variant">
                        Ingredients (Bill of Materials)
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                        BOM
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Recipe category</span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {form.category}
                      </span>
                      {form.category !== 'General' && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface">
                          + General
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-on-surface leading-relaxed max-w-[52ch]">
                      <span className="font-semibold text-on-surface">How to use this list:</span>{' '}
                      set <span className="font-semibold">Stock on hand</span> to your real warehouse count (inventory unit). Set{' '}
                      <span className="font-semibold">Qty needed (recipe)</span> for how much goes into this recipe per serving. Leave recipe qty blank / 0 to exclude a row.
                      Rows highlight when the recipe uses the material.
                    </p>
                  </div>

                  <div className="shrink-0 w-full lg:w-auto">
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch">
                      <div className="rounded-2xl border border-outline-variant bg-surface-container-high px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Listed</p>
                        <p className="text-lg font-black text-on-surface font-headline leading-none mt-1">{bomMaterials.length}</p>
                      </div>
                      <div className="rounded-2xl border border-outline-variant bg-surface-container-high px-3 py-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">In recipe</p>
                        <p className="text-lg font-black text-primary font-headline leading-none mt-1">{selectedIngredientLines}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
                      <input
                        value={bomSearch}
                        onChange={e => setBomSearch(e.target.value)}
                        placeholder="Filter listed materials (optional)…"
                        className="w-full bg-surface-container-high border border-outline-variant rounded-xl py-2.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setBomSearch('')}
                      disabled={!bomSearch.trim()}
                      className="shrink-0 px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-high text-xs font-bold text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                  </div>

                  {form.category !== 'General' && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-xs text-on-surface-variant">
                        Table list defaults to <span className="font-semibold text-on-surface">{form.category}</span> + <span className="font-semibold text-on-surface">General</span>.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIncludeOtherCategoriesInBom(v => !v)}
                        className={`self-start sm:self-auto text-xs font-bold px-3 py-2 rounded-xl border transition-colors ${
                          includeOtherCategoriesInBom
                            ? 'bg-primary/15 text-primary border-primary/30'
                            : 'bg-surface-container-high text-on-surface border-outline-variant hover:bg-surface-bright'
                        }`}
                      >
                        {includeOtherCategoriesInBom ? 'Showing all categories in table' : 'Include other categories in table'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-outline-variant bg-gradient-to-br from-surface-container-high to-surface-container-low p-4 sm:p-5 space-y-3 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Quick add</p>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Searchable
                        </span>
                      </div>
                      <p className="text-sm text-on-surface mt-2 leading-relaxed">
                        Add materials for <span className="font-semibold">{form.category}</span>. Unit prices come from{' '}
                        <span className="font-semibold">Inventory → Unit Cost</span>. Use the <span className="font-semibold">Stock</span> column to change on-hand quantities without leaving this screen.
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl border border-outline-variant bg-surface px-3 py-2 text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Matches</p>
                      <p className="text-lg font-black text-on-surface font-headline leading-none">{pickerCandidates.length}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant" />
                      <input
                        value={pickerQuery}
                        onChange={e => setPickerQuery(e.target.value)}
                        placeholder="Type to filter ingredients (name, ID, dish tag, category)…"
                        className="w-full bg-surface border border-outline-variant rounded-xl py-2.5 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerQuery('')}
                      disabled={!pickerQuery.trim()}
                      className="shrink-0 px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-high text-xs font-bold text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="rounded-2xl border border-outline-variant bg-surface max-h-[min(52vh,520px)] overflow-y-auto">
                    {pickerCandidates.length === 0 ? (
                      <div className="p-4 text-sm text-on-surface-variant">
                        No matches. Try clearing the picker search, or retag inventory with the correct <span className="font-semibold text-on-surface">Dish Category</span>.
                      </div>
                    ) : (
                      <div className="divide-y divide-outline-variant">
                        {pickerCandidates.map(inv => {
                          const isPrimary = primaryPickInventory.some(p => p.id === inv.id);
                          return (
                            <div
                              key={inv.id}
                              className="flex flex-col sm:flex-row sm:items-stretch hover:bg-primary/[0.03] transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => addIngredientFromPicker(inv.id)}
                                className="flex-1 min-w-0 text-left px-4 py-3 sm:py-3 hover:bg-primary/5 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-on-surface break-words">{inv.name}</p>
                                    <p className="mt-1 text-[11px] text-on-surface-variant font-mono">
                                      {inv.id}
                                      <span className="text-on-surface-variant/60"> · </span>
                                      <span className="font-semibold text-on-surface">{inv.quantity} {inv.unit}</span> on hand
                                    </p>
                                    {inv.dishName ? (
                                      <p className="mt-1 text-[11px] text-on-surface">
                                        Dish tag: <span className="font-semibold">{inv.dishName}</span>
                                      </p>
                                    ) : null}
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Unit</p>
                                    <p className="text-sm font-black text-primary font-mono">
                                      {formatMoney(inv.costPerUnit, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                    </p>
                                    <p className="text-[10px] text-on-surface-variant mt-0.5">/ {inv.unit}</p>
                                    {!isPrimary && form.category !== 'General' ? (
                                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-tertiary">Other</p>
                                    ) : null}
                                  </div>
                                </div>
                              </button>
                              <div className="shrink-0 border-t sm:border-t-0 sm:border-l border-outline-variant px-4 py-3 sm:w-[9.5rem] bg-surface-container-high/80 flex flex-col justify-center gap-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-1">
                                  <Package className="w-3 h-3 opacity-70" />
                                  Stock
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={inv.quantity === 0 ? '' : inv.quantity}
                                  onChange={e => patchInventoryStock(inv.id, parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full bg-surface border border-outline-variant rounded-xl px-2 py-2 text-sm text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                                <span className="text-[10px] text-on-surface-variant text-center">{inv.unit}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {primaryPickInventory.length === 0 && form.category !== 'General' && (
                    <p className="text-xs text-on-surface-variant">
                      Tip: set each inventory item’s <span className="font-semibold text-on-surface">Dish Category</span> to{' '}
                      <span className="font-semibold text-on-surface">{form.category}</span> in Inventory so it appears in the primary list.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                {inventory.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm">
                    No inventory items yet. Add inventory first.
                  </div>
                ) : bomMaterials.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant text-sm space-y-2">
                    <p>
                      No materials match your current filters/search for <span className="font-semibold text-on-surface">{form.category}</span>.
                    </p>
                    <p className="text-xs">
                      Use <span className="font-semibold text-on-surface">Quick add</span> above (it can still list other categories), or clear search / retag inventory.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bomMaterials.map(inv => {
                      const ing = ingredientByInvId.get(inv.id);
                      const qty = ing?.qty ?? 0;
                      const unit: Unit = (ing?.unit as Unit) ?? inv.unit;
                      const allowedUnits: Unit[] = (['kg', 'g', 'L', 'ml', 'pcs'] as Unit[]).filter(u => canConvert(u, inv.unit));

                      const qtyInInvUnit = (() => {
                        if (!qty) return 0;
                        try {
                          return convertQty(qty, unit, inv.unit);
                        } catch {
                          return 0;
                        }
                      })();

                      const unitPriceInRecipeUnit = (() => {
                        try {
                          const oneInInvUnit = convertQty(1, unit, inv.unit);
                          if (!oneInInvUnit) return inv.costPerUnit;
                          return inv.costPerUnit / oneInInvUnit;
                        } catch {
                          return inv.costPerUnit;
                        }
                      })();

                      const rowCost = qtyInInvUnit > 0 ? (qtyInInvUnit * inv.costPerUnit).toFixed(2) : '0.00';

                      return (
                        <div
                          key={inv.id}
                          className={`rounded-2xl border p-4 transition-colors ${
                            qty > 0 ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/15' : 'bg-surface-container-high border-outline-variant'
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-bold text-on-surface leading-snug break-words">{inv.name}</p>
                                <span className="shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-surface-container-highest border border-outline-variant text-on-surface-variant">
                                  {inv.dishCategory}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-on-surface-variant">
                                <span className="font-mono">{inv.id}</span>
                                <span className="text-on-surface-variant/70">·</span>
                                <span className="font-semibold text-on-surface">{inv.quantity} {inv.unit}</span>
                                <span className="text-on-surface-variant/70">in stock</span>
                                {inv.dishName ? (
                                  <>
                                    <span className="text-on-surface-variant/70">·</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-highest px-2 py-0.5 font-bold text-on-surface">
                                      {inv.dishName}
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>

                            <div className="rounded-xl border border-secondary/25 bg-secondary/5 p-3">
                              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">
                                <Package className="w-3.5 h-3.5 text-secondary" />
                                Stock on hand (inventory)
                              </label>
                              <p className="text-[10px] text-on-surface-variant mb-2 leading-relaxed">
                                Warehouse quantity in <span className="font-semibold text-on-surface">{inv.unit}</span> — updates the same inventory record as the Inventory screen.
                              </p>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={inv.quantity === 0 ? '' : inv.quantity}
                                onChange={e => patchInventoryStock(inv.id, parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                className="w-full max-w-[12rem] bg-surface border border-outline-variant rounded-xl px-3 py-2.5 text-base text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/40"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="rounded-xl border border-outline-variant bg-surface p-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">
                                  Qty needed (recipe)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={qty === 0 ? '' : qty}
                                  onChange={e => setIngredientForInventory(inv.id, parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-base text-center text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                              </div>

                              <div className="rounded-xl border border-outline-variant bg-surface p-3">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2">
                                  Unit
                                </label>
                                <select
                                  value={unit}
                                  onChange={e => setIngredientForInventory(inv.id, qty, e.target.value as Unit)}
                                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
                                >
                                  {allowedUnits.map(u => (
                                    <option key={u} value={u} className="bg-surface text-on-surface">{u}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="rounded-xl border border-outline-variant bg-surface p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Unit price</p>
                                <p className="mt-1 text-lg font-black text-on-surface font-mono">
                                  {formatMoney(unitPriceInRecipeUnit, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
                                </p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">per {unit} (scaled from inventory)</p>
                              </div>
                              <div className="rounded-xl border border-outline-variant bg-surface p-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Line total</p>
                                <p className="mt-1 text-lg font-black text-primary font-mono">{formatMoney(parseFloat(rowCost))}</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">
                                  {qty > 0
                                    ? `${qty} ${unit} × ${formatMoney(unitPriceInRecipeUnit, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
                                    : 'Enter qty to calculate'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cost Summary Base */}
              <div className="mt-4 pt-4 border-t border-outline-variant shrink-0 text-right space-y-1">
                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-widest">Total Recipe Cost</p>
                <p className="text-3xl font-black text-primary font-mono tracking-tight">{formatMoney(calculateTotalCost())}</p>
                <p className="text-[10px] text-on-surface-variant">Estimated COGS based on current inventory pricing</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
