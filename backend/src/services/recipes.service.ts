import pool from '../config/db';
import { Recipe, Ingredient } from '../types';

export async function getAllRecipes(search?: string): Promise<Recipe[]> {
  let query = 'SELECT * FROM recipes';
  const params: string[] = [];
  if (search) {
    params.push(`%${search}%`);
    query += ` WHERE name ILIKE $1`;
  }
  query += ' ORDER BY name';
  const { rows: recipes } = await pool.query<Recipe>(query, params);
  for (const recipe of recipes) {
    const { rows: ingredients } = await pool.query<Ingredient>(
      `SELECT i.* FROM ingredients i
       JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = $1
       ORDER BY ri.sort_order`,
      [recipe.id]
    );
    recipe.ingredients = ingredients;
  }
  return recipes;
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  const { rows } = await pool.query<Recipe>('SELECT * FROM recipes WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  const recipe = rows[0];
  const { rows: ingredients } = await pool.query<Ingredient>(
    `SELECT i.* FROM ingredients i
     JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
     WHERE ri.recipe_id = $1
     ORDER BY ri.sort_order`,
    [recipe.id]
  );
  recipe.ingredients = ingredients;
  return recipe;
}

export async function createRecipe(name: string, ingredientNames: string[]): Promise<Recipe> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [recipe] } = await client.query<Recipe>(
      'INSERT INTO recipes (name) VALUES ($1) RETURNING *',
      [name]
    );
    const ingredients: Ingredient[] = [];
    for (let i = 0; i < ingredientNames.length; i++) {
      const { rows: [ingredient] } = await client.query<Ingredient>(
        `INSERT INTO ingredients (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [ingredientNames[i].trim()]
      );
      await client.query(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, sort_order) VALUES ($1, $2, $3)',
        [recipe.id, ingredient.id, i]
      );
      ingredients.push(ingredient);
    }
    await client.query('COMMIT');
    recipe.ingredients = ingredients;
    return recipe;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateRecipe(id: number, name: string, ingredientNames: string[]): Promise<Recipe | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query<Recipe>(
      'UPDATE recipes SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [name, id]
    );
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    const recipe = rows[0];
    await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [id]);
    const ingredients: Ingredient[] = [];
    for (let i = 0; i < ingredientNames.length; i++) {
      const { rows: [ingredient] } = await client.query<Ingredient>(
        `INSERT INTO ingredients (name) VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [ingredientNames[i].trim()]
      );
      await client.query(
        'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, sort_order) VALUES ($1, $2, $3)',
        [recipe.id, ingredient.id, i]
      );
      ingredients.push(ingredient);
    }
    await client.query('COMMIT');
    recipe.ingredients = ingredients;
    return recipe;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteRecipe(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM recipes WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function getRecipeIngredientsWithLots(recipeId: number): Promise<Ingredient[]> {
  const { rows } = await pool.query<Ingredient>(
    `SELECT i.* FROM ingredients i
     JOIN recipe_ingredients ri ON ri.ingredient_id = i.id
     WHERE ri.recipe_id = $1
     ORDER BY ri.sort_order`,
    [recipeId]
  );
  return rows;
}
