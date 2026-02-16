export interface Ingredient {
  id: number;
  name: string;
  last_lot_number: string | null;
  is_highlighted?: boolean;
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

export interface RecipeIngredient {
  id: number;
  recipe_id: number;
  ingredient_id: number;
  sort_order: number;
}

export interface Lot {
  id: number;
  lot_number: string;
  recipe_id: number;
  notes: string | null;
  created_at: string;
  recipe_name?: string;
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

export interface CreateRecipeBody {
  name: string;
  ingredients: string[];
}

export interface CreateLotBody {
  recipe_id: number;
  ingredients: { ingredient_id: number; lot_number: string; sort_order?: number; is_highlighted?: boolean }[];
  notes?: string;
}
