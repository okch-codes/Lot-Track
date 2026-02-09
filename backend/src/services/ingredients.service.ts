import pool from '../config/db';
import { Ingredient } from '../types';

export async function getAllIngredients(
  search?: string, page = 1, limit = 50
): Promise<{ data: Ingredient[]; total: number }> {
  const params: string[] = [];
  let where = '';
  if (search) {
    params.push(`%${search}%`);
    where = ` WHERE name ILIKE $1`;
  }

  const countResult = await pool.query(`SELECT COUNT(*) FROM ingredients${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  const offset = (page - 1) * limit;
  params.push(String(limit), String(offset));
  const limitIdx = params.length - 1;
  const query = `SELECT * FROM ingredients${where} ORDER BY name LIMIT $${limitIdx} OFFSET $${limitIdx + 1}`;
  const { rows } = await pool.query<Ingredient>(query, params);

  return { data: rows, total };
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
