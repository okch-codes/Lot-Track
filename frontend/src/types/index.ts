export interface Ingredient {
  id: number;
  name: string;
  last_lot_number: string | null;
  is_highlighted?: boolean;
  cost_price_cents: number | null;
  cost_vat_rate: number | null;
  cost_unit: string | null;
  cost_package_size: number | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: number;
  name: string;
  cost_yield: number | null;
  cost_yield_unit: string | null;
  created_at: string;
  updated_at: string;
  ingredients?: Ingredient[];
}

export interface Lot {
  id: number;
  lot_number: string;
  recipe_id: number;
  recipe_name?: string;
  notes: string | null;
  created_at: string;
  ingredients?: LotIngredient[];
}

export interface LotIngredient {
  id: number;
  lot_id: number;
  ingredient_id: number;
  lot_number: string | null;
  ingredient_name?: string;
  sort_order?: number;
  is_highlighted?: boolean;
}

export interface LotHistoryEntry {
  lot_number: string | null;
  lot_code: string;
  created_at: string;
  recipe_name: string;
}

export interface PlanningEvent {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  planning_event_id: number;
  client_name: string;
  extra: string | null;
  delivery_date: string | null;
  delivery_address: string | null;
  price_cents: number | null;
  is_ready: boolean;
  is_delivered: boolean;
  is_paid: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  recipe_id: number;
  recipe_name?: string;
  size: string;
  quantity: number;
}

export interface PlanningColumn {
  recipe_id: number;
  recipe_name: string;
  size: string;
}

export interface RecipeCostItem {
  id: number | null;
  recipe_id: number;
  ingredient_id: number;
  ingredient_name: string;
  quantity: number | null;
  cost_price_cents: number | null;
  cost_vat_rate: number | null;
  cost_unit: string | null;
  cost_package_size: number | null;
}

export interface RecipeCostData {
  recipe: Recipe;
  items: RecipeCostItem[];
}

export interface InvoiceItem {
  name: string;
  price_cents: number;
  vat_rate: number;
  unit: string;
  package_size: number;
}

export interface PlanningGridData {
  event: PlanningEvent;
  orders: Order[];
  totals: Record<string, number>;
  columns: PlanningColumn[];
}
