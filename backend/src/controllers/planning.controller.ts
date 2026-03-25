import { Request, Response, NextFunction } from 'express';
import * as planningService from '../services/planning.service';
import { isNonEmptyString, isPositiveInt } from '../utils/validate';

export async function getEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const events = await planningService.listEvents();
    res.json(events);
  } catch (err) { next(err); }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body;
    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: 'name is required' });
    }
    const event = await planningService.createEvent(name);
    res.status(201).json(event);
  } catch (err) { next(err); }
}

export async function getEventGrid(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const grid = await planningService.getEventGrid(Number(req.params.eventId));
    if (!grid) return res.status(404).json({ error: 'Event not found' });
    res.json(grid);
  } catch (err) { next(err); }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const { name } = req.body;
    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: 'name is required' });
    }
    const event = await planningService.updateEvent(Number(req.params.eventId), name);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (err) { next(err); }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const deleted = await planningService.deleteEvent(Number(req.params.eventId));
    if (!deleted) return res.status(404).json({ error: 'Event not found' });
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function createOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const { client_name } = req.body;
    if (!isNonEmptyString(client_name)) {
      return res.status(400).json({ error: 'client_name is required' });
    }
    const order = await planningService.createOrder(Number(req.params.eventId), client_name);
    res.status(201).json(order);
  } catch (err) { next(err); }
}

export async function patchOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }
    const order = await planningService.patchOrder(Number(req.params.orderId), req.body);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { next(err); }
}

export async function upsertItem(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }
    const { recipe_id, size, quantity } = req.body;
    if (!isPositiveInt(recipe_id)) {
      return res.status(400).json({ error: 'recipe_id is required' });
    }
    if (!isNonEmptyString(size, 50)) {
      return res.status(400).json({ error: 'size is required' });
    }
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'quantity must be >= 0' });
    }
    await planningService.upsertOrderItem(
      Number(req.params.orderId), recipe_id, size, quantity
    );
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function createColumn(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const { recipe_id, size } = req.body;
    if (!isPositiveInt(recipe_id)) {
      return res.status(400).json({ error: 'recipe_id is required' });
    }
    if (!isNonEmptyString(size, 50)) {
      return res.status(400).json({ error: 'size is required' });
    }
    const col = await planningService.createColumn(Number(req.params.eventId), recipe_id, size);
    res.status(201).json(col);
  } catch (err) { next(err); }
}

export async function moveRecipeGroup(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const { recipe_id, direction } = req.body;
    if (!isPositiveInt(recipe_id)) {
      return res.status(400).json({ error: 'recipe_id is required' });
    }
    if (direction !== 'left' && direction !== 'right') {
      return res.status(400).json({ error: 'direction must be "left" or "right"' });
    }
    await planningService.moveRecipeGroup(Number(req.params.eventId), recipe_id, direction);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function moveColumn(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const { recipe_id, size, direction } = req.body;
    if (!isPositiveInt(recipe_id)) {
      return res.status(400).json({ error: 'recipe_id is required' });
    }
    if (!isNonEmptyString(size, 50)) {
      return res.status(400).json({ error: 'size is required' });
    }
    if (direction !== 'left' && direction !== 'right') {
      return res.status(400).json({ error: 'direction must be "left" or "right"' });
    }
    await planningService.moveColumn(Number(req.params.eventId), recipe_id, size, direction);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function deleteColumn(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.eventId)) {
      return res.status(400).json({ error: 'Invalid eventId' });
    }
    const { recipe_id, size } = req.body;
    if (!isPositiveInt(recipe_id)) {
      return res.status(400).json({ error: 'recipe_id is required' });
    }
    if (!isNonEmptyString(size, 50)) {
      return res.status(400).json({ error: 'size is required' });
    }
    await planningService.deleteColumn(Number(req.params.eventId), recipe_id, size);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function deleteOrder(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }
    const deleted = await planningService.deleteOrder(Number(req.params.orderId));
    if (!deleted) return res.status(404).json({ error: 'Order not found' });
    res.status(204).send();
  } catch (err) { next(err); }
}
