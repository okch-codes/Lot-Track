import pool from '../config/db';
import { Ingredient, Recipe, RecipeCostItem } from '../types';

export async function updateIngredientCost(
  id: number,
  fields: { cost_price_cents?: number | null; cost_vat_rate?: number | null; cost_unit?: string | null; cost_package_size?: number | null }
): Promise<Ingredient | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowed = ['cost_price_cents', 'cost_vat_rate', 'cost_unit', 'cost_package_size'] as const;
  for (const field of allowed) {
    if (field in fields) {
      setClauses.push(`${field} = $${idx}`);
      values.push(fields[field as keyof typeof fields]);
      idx++;
    }
  }
  if (setClauses.length === 0) return null;

  setClauses.push('updated_at = NOW()');
  values.push(id);

  const { rows } = await pool.query<Ingredient>(
    `UPDATE ingredients SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function getIngredientsWithCosts(): Promise<Ingredient[]> {
  const { rows } = await pool.query<Ingredient>(
    'SELECT * FROM ingredients ORDER BY name'
  );
  return rows;
}

export async function getRecipeCost(recipeId: number): Promise<{
  recipe: Recipe;
  items: RecipeCostItem[];
} | null> {
  const { rows: recipeRows } = await pool.query<Recipe>(
    'SELECT * FROM recipes WHERE id = $1',
    [recipeId]
  );
  if (recipeRows.length === 0) return null;

  // Get recipe ingredients with cost data and quantities
  const { rows: items } = await pool.query<RecipeCostItem>(
    `SELECT
       ri.ingredient_id,
       i.name AS ingredient_name,
       i.cost_price_cents,
       i.cost_vat_rate,
       i.cost_unit,
       i.cost_package_size,
       rci.id,
       rci.quantity
     FROM recipe_ingredients ri
     JOIN ingredients i ON i.id = ri.ingredient_id
     LEFT JOIN recipe_cost_items rci ON rci.recipe_id = ri.recipe_id AND rci.ingredient_id = ri.ingredient_id
     WHERE ri.recipe_id = $1
     ORDER BY ri.sort_order`,
    [recipeId]
  );

  return { recipe: recipeRows[0], items };
}

export async function upsertRecipeCostItem(
  recipeId: number, ingredientId: number, quantity: number
): Promise<void> {
  if (quantity <= 0) {
    await pool.query(
      'DELETE FROM recipe_cost_items WHERE recipe_id = $1 AND ingredient_id = $2',
      [recipeId, ingredientId]
    );
  } else {
    await pool.query(
      `INSERT INTO recipe_cost_items (recipe_id, ingredient_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (recipe_id, ingredient_id)
       DO UPDATE SET quantity = $3`,
      [recipeId, ingredientId, quantity]
    );
  }
}

export async function updateRecipeYield(
  recipeId: number, costYield: number | null, costYieldUnit: string | null
): Promise<Recipe | null> {
  const { rows } = await pool.query<Recipe>(
    'UPDATE recipes SET cost_yield = $1, cost_yield_unit = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
    [costYield, costYieldUnit, recipeId]
  );
  return rows[0] ?? null;
}
