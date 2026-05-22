export interface RecipeIngredient {
  inventoryId: string;
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  prepTime: number;
  cookTime: number;
  ingredients: RecipeIngredient[];
  instructions: string;
}

export const RECIPE_CATEGORIES = ['Mains', 'Starters', 'Desserts', 'Drinks', 'Sides', 'Sauces'];

export const BLANK_RECIPE: Omit<Recipe, 'id'> = {
  name: '',
  category: 'Mains',
  prepTime: 10,
  cookTime: 10,
  ingredients: [],
  instructions: ''
};

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'REC-001',
    name: 'Wagyu Burger',
    category: 'Mains',
    prepTime: 10,
    cookTime: 8,
    ingredients: [
      { inventoryId: 'INV-001', name: 'Wagyu Beef', qty: 0.2, unit: 'kg', unitCost: 45.00 },
      { inventoryId: 'INV-003', name: 'Truffle Oil', qty: 0.01, unit: 'L', unitCost: 120.00 }
    ],
    instructions: '1. Season wagyu beef patty with salt and pepper.\n2. Grill on medium-high heat for 4 minutes per side.\n3. Toast brioche buns lightly.\n4. Apply 10ml of truffle oil emulsion to the bun.\n5. Assemble and serve immediately.'
  },
  {
    id: 'REC-002',
    name: 'Espresso Martini',
    category: 'Drinks',
    prepTime: 3,
    cookTime: 0,
    ingredients: [
      { inventoryId: 'INV-012', name: 'Vodka', qty: 0.05, unit: 'L', unitCost: 18.00 },
      { inventoryId: 'INV-015', name: 'Espresso Beans', qty: 0.02, unit: 'kg', unitCost: 22.00 }
    ],
    instructions: '1. Brew a fresh shot of espresso.\n2. Add vodka, espresso, and coffee liqueur to a shaker with ice.\n3. Shake vigorously for 15 seconds to create foam.\n4. Strain into a chilled martini glass.\n5. Garnish with 3 espresso beans.'
  }
];
