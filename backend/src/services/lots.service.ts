import pool from '../config/db';
import { Lot, CreateLotBody } from '../types';

export async function getAllLots(search?: string, from?: string, to?: string): Promise<Lot[]> {
  let query = `SELECT l.*, r.name as recipe_name
     FROM lots l
     JOIN recipes r ON r.id = l.recipe_id`;
  const params: string[] = [];
  const conditions: string[] = [];

  if (search) {
    params.push(`%${search}%`);
    const i = params.length;
    conditions.push(`(l.lot_number ILIKE $${i} OR r.name ILIKE $${i})`);
  }
  if (from) {
    params.push(from);
    conditions.push(`l.created_at >= $${params.length}::date`);
  }
  if (to) {
    params.push(to);
    conditions.push(`l.created_at < ($${params.length}::date + interval '1 day')`);
  }
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY l.created_at DESC';
  const { rows } = await pool.query<Lot>(query, params);
  return rows;
}

export async function getLotById(id: number): Promise<Lot | null> {
  const { rows } = await pool.query<Lot>(
    `SELECT l.*, r.name as recipe_name
     FROM lots l
     JOIN recipes r ON r.id = l.recipe_id
     WHERE l.id = $1`,
    [id]
  );
  if (rows.length === 0) return null;
  const lot = rows[0];
  const { rows: ingredients } = await pool.query(
    `SELECT li.*, i.name as ingredient_name
     FROM lot_ingredients li
     JOIN ingredients i ON i.id = li.ingredient_id
     WHERE li.lot_id = $1`,
    [lot.id]
  );
  lot.ingredients = ingredients;
  return lot;
}

export async function getNextLotNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  const prefix = `${dateStr}-`;
  const { rows } = await pool.query(
    `SELECT lot_number FROM lots
     WHERE lot_number LIKE $1
     ORDER BY lot_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let nextSeq = 1;
  if (rows.length > 0) {
    const lastNum = parseInt(rows[0].lot_number.split('-')[1], 10);
    nextSeq = lastNum + 1;
  }
  return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
}

export async function createLot(body: CreateLotBody): Promise<Lot> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const today = new Date().toISOString().slice(0, 10);
    const { rows: existing } = await client.query(
      `SELECT id FROM lots
       WHERE recipe_id = $1 AND created_at::date = $2::date`,
      [body.recipe_id, today]
    );
    if (existing.length > 0) {
      throw new Error('A lot for this recipe already exists today');
    }

    const lotNumber = await getNextLotNumberWithClient(client);
    const { rows: [lot] } = await client.query<Lot>(
      'INSERT INTO lots (lot_number, recipe_id, notes) VALUES ($1, $2, $3) RETURNING *',
      [lotNumber, body.recipe_id, body.notes || null]
    );
    for (const ing of body.ingredients) {
      await client.query(
        'INSERT INTO lot_ingredients (lot_id, ingredient_id, lot_number) VALUES ($1, $2, $3)',
        [lot.id, ing.ingredient_id, ing.lot_number]
      );
      await client.query(
        'UPDATE ingredients SET last_lot_number = $1, updated_at = NOW() WHERE id = $2',
        [ing.lot_number, ing.ingredient_id]
      );
    }
    await client.query('COMMIT');
    return (await getLotById(lot.id))!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function getNextLotNumberWithClient(client: any): Promise<string> {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0');
  const prefix = `${dateStr}-`;
  const { rows } = await client.query(
    `SELECT lot_number FROM lots
     WHERE lot_number LIKE $1
     ORDER BY lot_number DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let nextSeq = 1;
  if (rows.length > 0) {
    const lastNum = parseInt(rows[0].lot_number.split('-')[1], 10);
    nextSeq = lastNum + 1;
  }
  return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
}

export async function updateLot(
  id: number,
  body: { ingredients: { ingredient_id: number; lot_number: string }[]; notes?: string }
): Promise<Lot | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id FROM lots WHERE id = $1', [id]);
    if (rows.length === 0) {
      await client.query('ROLLBACK');
      return null;
    }
    await client.query('UPDATE lots SET notes = $1 WHERE id = $2', [body.notes ?? null, id]);
    await client.query('DELETE FROM lot_ingredients WHERE lot_id = $1', [id]);
    for (const ing of body.ingredients) {
      await client.query(
        'INSERT INTO lot_ingredients (lot_id, ingredient_id, lot_number) VALUES ($1, $2, $3)',
        [id, ing.ingredient_id, ing.lot_number]
      );
      await client.query(
        'UPDATE ingredients SET last_lot_number = $1, updated_at = NOW() WHERE id = $2',
        [ing.lot_number, ing.ingredient_id]
      );
    }
    await client.query('COMMIT');
    return (await getLotById(id))!;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteLot(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM lots WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}
