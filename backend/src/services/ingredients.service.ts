import pool from '../config/db';
import { Ingredient } from '../types';

export async function getAllIngredients(search?: string): Promise<Ingredient[]> {
  let query = 'SELECT * FROM ingredients';
  const params: string[] = [];
  if (search) {
    params.push(`%${search}%`);
    query += ` WHERE name ILIKE $1`;
  }
  query += ' ORDER BY name';
  const { rows } = await pool.query<Ingredient>(query, params);
  return rows;
}

export async function getLotHistory(ingredientId: number) {
  const { rows } = await pool.query(
    `SELECT li.lot_number, l.lot_number as lot_code, l.created_at, r.name as recipe_name
     FROM lot_ingredients li
     JOIN lots l ON l.id = li.lot_id
     JOIN recipes r ON r.id = l.recipe_id
     WHERE li.ingredient_id = $1
     ORDER BY l.created_at DESC`,
    [ingredientId]
  );
  return rows;
}

export async function updateLastLotNumber(id: number, lastLotNumber: string): Promise<Ingredient | null> {
  const { rows } = await pool.query<Ingredient>(
    'UPDATE ingredients SET last_lot_number = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [lastLotNumber, id]
  );
  return rows[0] || null;
}
