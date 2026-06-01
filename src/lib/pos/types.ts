import type { Unit } from './units';
import type { DishCategory } from './constants';

export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  dishCategory: DishCategory;
  dishName: string;
  quantity: number;
  unit: Unit;
  costPerUnit: number;
  minLevel: number;
  expiryDate?: string;
};

export type RecipeIngredient = {
  inventoryId: string;
  qty: number;
  unit: Unit;
};

export type Recipe = {
  id: string;
  name: string;
  category: string;
  prepTime: number;
  cookTime: number;
  ingredients: RecipeIngredient[];
  instructions?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  recipeId: string; // must exist
  image?: string;
  posIcon?: string; // lucide icon key (optional)
};

export type OrderItem = {
  menuItemId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
};

/** Where / how the guest is being served (POS + dining views). */
export type ServiceChannel = 'dine_in' | 'takeaway' | 'delivery';

export type Order = {
  id: string;
  createdAtIso: string;
  /** Short label for receipt / floor (e.g. "Table 7", "Takeaway · Ali", "Delivery · Sam"). */
  table: string;
  paymentMethod: string;
  items: OrderItem[];
  /** Sum of line extensions at list price (before promotion). */
  grossSubtotal: number;
  /** Reduction from promotion (grossSubtotal − subtotal). */
  discountTotal: number;
  /** Taxable amount after promotion. */
  subtotal: number;
  tax: number;
  total: number;
  promotionId?: string | null;
  promotionName?: string | null;
  serviceChannel: ServiceChannel;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: string | null;
  deliveryNotes?: string | null;
};

export type PromotionKind = 'percent_off' | 'fixed_off_order' | 'bogo_menu_item' | 'package_deal';

/** One line in a fixed bundle (e.g. 1× burger + 1× fries + 1× drink). */
export type PackageDealLine = {
  menuItemId: string;
  qty: number;
};

type PromotionBase = {
  id: string;
  name: string;
  description: string;
  active: boolean;
};

export type Promotion =
  | (PromotionBase & { kind: 'percent_off'; percent: number })
  | (PromotionBase & { kind: 'fixed_off_order'; fixedAmount: number })
  | (PromotionBase & { kind: 'bogo_menu_item'; bogoMenuItemId: string })
  | (PromotionBase & { kind: 'package_deal'; lines: PackageDealLine[]; bundlePrice: number });

export type InventoryUsage = {
  id: string;
  createdAtIso: string;
  orderId: string;
  inventoryId: string;
  quantity: number;
  unit: Unit;
};

export type Vendor = {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  accountNumber: string;
  paymentTerms: string;
  notes: string;
  active: boolean;
};

export type PosStateV1 = {
  version: 1;
  inventory: InventoryItem[];
  recipes: Recipe[];
  menu: MenuItem[];
  orders: Order[];
  usage: InventoryUsage[];
  vendors: Vendor[];
  promotions: Promotion[];
};

export type PlaceOrderInput = {
  table: string;
  paymentMethod: string;
  items: Array<{ menuItemId: string; qty: number }>;
  taxRate?: number;
  promotionId?: string | null;
  serviceChannel?: ServiceChannel;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
};

