export interface Ingredient {
  id: number;
  name: string;
  last_lot_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: number;
  name: string;
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
}

export interface LotHistoryEntry {
  lot_number: string | null;
  lot_code: string;
  created_at: string;
  recipe_name: string;
}
