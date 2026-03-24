import pool from '../config/db';
import { PlanningEvent, Order, OrderItem, PlanningColumn } from '../types';

export async function listEvents(): Promise<PlanningEvent[]> {
  const { rows } = await pool.query<PlanningEvent>(
    'SELECT * FROM planning_events ORDER BY created_at DESC'
  );
  return rows;
}

export async function createEvent(name: string): Promise<PlanningEvent> {
  const { rows: [event] } = await pool.query<PlanningEvent>(
    'INSERT INTO planning_events (name) VALUES ($1) RETURNING *',
    [name.trim()]
  );
  return event;
}

export async function updateEvent(id: number, name: string): Promise<PlanningEvent | null> {
  const { rows } = await pool.query<PlanningEvent>(
    'UPDATE planning_events SET name = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [name.trim(), id]
  );
  return rows[0] ?? null;
}

export async function deleteEvent(id: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM planning_events WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function getEventGrid(eventId: number): Promise<{
  event: PlanningEvent;
  orders: Order[];
  totals: Record<string, number>;
  columns: PlanningColumn[];
} | null> {
  // Get event
  const { rows: eventRows } = await pool.query<PlanningEvent>(
    'SELECT * FROM planning_events WHERE id = $1', [eventId]
  );
  if (eventRows.length === 0) return null;
  const event = eventRows[0];

  // Get orders
  const { rows: orderRows } = await pool.query<Order>(
    'SELECT * FROM orders WHERE planning_event_id = $1 ORDER BY sort_order, id',
    [eventId]
  );

  // Get all items for these orders with recipe names
  if (orderRows.length > 0) {
    const orderIds = orderRows.map(o => o.id);
    const { rows: itemRows } = await pool.query<OrderItem & { order_id: number }>(
      `SELECT oi.*, r.name AS recipe_name
       FROM order_items oi
       JOIN recipes r ON r.id = oi.recipe_id
       WHERE oi.order_id = ANY($1)`,
      [orderIds]
    );
    const itemsByOrder = new Map<number, OrderItem[]>();
    for (const item of itemRows) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id)!.push(item);
    }
    for (const order of orderRows) {
      order.items = itemsByOrder.get(order.id) ?? [];
    }
  } else {
    for (const order of orderRows) {
      order.items = [];
    }
  }

  // Get columns from planning_columns table
  const { rows: columnRows } = await pool.query<PlanningColumn>(
    `SELECT pc.recipe_id, r.name AS recipe_name, pc.size
     FROM planning_columns pc
     JOIN recipes r ON r.id = pc.recipe_id
     WHERE pc.planning_event_id = $1
     ORDER BY pc.sort_order, r.name, pc.size`,
    [eventId]
  );

  // Get totals
  const { rows: totalRows } = await pool.query<{ recipe_id: number; size: string; total: string }>(
    `SELECT oi.recipe_id, oi.size, SUM(oi.quantity) AS total
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.planning_event_id = $1
     GROUP BY oi.recipe_id, oi.size`,
    [eventId]
  );
  const totals: Record<string, number> = {};
  for (const row of totalRows) {
    totals[`${row.recipe_id}_${row.size}`] = parseInt(row.total, 10);
  }

  return { event, orders: orderRows, totals, columns: columnRows };
}

export async function createOrder(eventId: number, clientName: string): Promise<Order> {
  // Get next sort_order
  const { rows: [{ max }] } = await pool.query<{ max: number | null }>(
    'SELECT MAX(sort_order) AS max FROM orders WHERE planning_event_id = $1',
    [eventId]
  );
  const sortOrder = (max ?? -1) + 1;

  const { rows: [order] } = await pool.query<Order>(
    `INSERT INTO orders (planning_event_id, client_name, sort_order)
     VALUES ($1, $2, $3) RETURNING *`,
    [eventId, clientName.trim(), sortOrder]
  );
  order.items = [];
  return order;
}

export async function patchOrder(
  orderId: number,
  fields: Partial<Pick<Order, 'client_name' | 'extra' | 'delivery_date' | 'delivery_address' | 'price_cents' | 'is_ready' | 'is_delivered' | 'is_paid' | 'sort_order'>>
): Promise<Order | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowedFields = [
    'client_name', 'extra', 'delivery_date', 'delivery_address',
    'price_cents', 'is_ready', 'is_delivered', 'is_paid', 'sort_order'
  ] as const;

  for (const field of allowedFields) {
    if (field in fields) {
      setClauses.push(`${field} = $${idx}`);
      values.push(fields[field as keyof typeof fields]);
      idx++;
    }
  }

  if (setClauses.length === 0) return null;

  setClauses.push(`updated_at = NOW()`);
  values.push(orderId);

  const { rows } = await pool.query<Order>(
    `UPDATE orders SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );
  return rows[0] ?? null;
}

export async function upsertOrderItem(
  orderId: number, recipeId: number, size: string, quantity: number
): Promise<void> {
  if (quantity <= 0) {
    await pool.query(
      'DELETE FROM order_items WHERE order_id = $1 AND recipe_id = $2 AND size = $3',
      [orderId, recipeId, size]
    );
  } else {
    await pool.query(
      `INSERT INTO order_items (order_id, recipe_id, size, quantity)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (order_id, recipe_id, size)
       DO UPDATE SET quantity = $4`,
      [orderId, recipeId, size, quantity]
    );
  }
}

export async function createColumn(eventId: number, recipeId: number, size: string): Promise<PlanningColumn> {
  const { rows: [{ max }] } = await pool.query<{ max: number | null }>(
    'SELECT MAX(sort_order) AS max FROM planning_columns WHERE planning_event_id = $1',
    [eventId]
  );
  const sortOrder = (max ?? -1) + 1;

  const { rows: [col] } = await pool.query<PlanningColumn & { id: number }>(
    `INSERT INTO planning_columns (planning_event_id, recipe_id, size, sort_order)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (planning_event_id, recipe_id, size) DO NOTHING
     RETURNING *`,
    [eventId, recipeId, size.trim(), sortOrder]
  );

  // If already existed, just fetch it
  if (!col) {
    const { rows: [existing] } = await pool.query<PlanningColumn>(
      `SELECT pc.recipe_id, r.name AS recipe_name, pc.size
       FROM planning_columns pc JOIN recipes r ON r.id = pc.recipe_id
       WHERE pc.planning_event_id = $1 AND pc.recipe_id = $2 AND pc.size = $3`,
      [eventId, recipeId, size.trim()]
    );
    return existing;
  }

  // Fetch with recipe_name
  const { rows: [result] } = await pool.query<PlanningColumn>(
    `SELECT pc.recipe_id, r.name AS recipe_name, pc.size
     FROM planning_columns pc JOIN recipes r ON r.id = pc.recipe_id
     WHERE pc.id = $1`,
    [col.id]
  );
  return result;
}

export async function deleteColumn(eventId: number, recipeId: number, size: string): Promise<void> {
  // Remove the column definition
  await pool.query(
    'DELETE FROM planning_columns WHERE planning_event_id = $1 AND recipe_id = $2 AND size = $3',
    [eventId, recipeId, size]
  );
  // Remove all related order items
  await pool.query(
    `DELETE FROM order_items
     WHERE recipe_id = $1 AND size = $2
       AND order_id IN (SELECT id FROM orders WHERE planning_event_id = $3)`,
    [recipeId, size, eventId]
  );
}

export async function deleteOrder(orderId: number): Promise<boolean> {
  const { rowCount } = await pool.query('DELETE FROM orders WHERE id = $1', [orderId]);
  return (rowCount ?? 0) > 0;
}
