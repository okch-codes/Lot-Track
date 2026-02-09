import { Request, Response, NextFunction } from 'express';
import * as lotsService from '../services/lots.service';
import { isPositiveInt, isNonEmptyString, isDateString } from '../utils/validate';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    if (from && !isDateString(from)) {
      return res.status(400).json({ error: 'Invalid from date format (YYYY-MM-DD)' });
    }
    if (to && !isDateString(to)) {
      return res.status(400).json({ error: 'Invalid to date format (YYYY-MM-DD)' });
    }
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const result = await lotsService.getAllLots(search, from, to, page, limit);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const lot = await lotsService.getLotById(Number(req.params.id));
    if (!lot) return res.status(404).json({ error: 'Lot not found' });
    res.json(lot);
  } catch (err) { next(err); }
}

export async function nextNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const number = await lotsService.getNextLotNumber();
    res.json({ next_number: number });
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { recipe_id, ingredients, notes } = req.body;
    if (!isPositiveInt(recipe_id)) {
      return res.status(400).json({ error: 'recipe_id must be a positive integer' });
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0 || ingredients.length > 100) {
      return res.status(400).json({ error: 'ingredients must be an array with 1-100 items' });
    }
    for (const ing of ingredients) {
      if (!isPositiveInt(ing.ingredient_id) || !isNonEmptyString(ing.lot_number, 100)) {
        return res.status(400).json({ error: 'Each ingredient must have a valid ingredient_id and lot_number' });
      }
    }
    if (notes !== undefined && typeof notes === 'string' && notes.length > 1000) {
      return res.status(400).json({ error: 'notes must be at most 1000 characters' });
    }
    const lot = await lotsService.createLot({ recipe_id, ingredients, notes });
    res.status(201).json(lot);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { ingredients, notes } = req.body;
    if (!Array.isArray(ingredients) || ingredients.length === 0 || ingredients.length > 100) {
      return res.status(400).json({ error: 'ingredients must be an array with 1-100 items' });
    }
    for (const ing of ingredients) {
      if (!isPositiveInt(ing.ingredient_id) || !isNonEmptyString(ing.lot_number, 100)) {
        return res.status(400).json({ error: 'Each ingredient must have a valid ingredient_id and lot_number' });
      }
    }
    if (notes !== undefined && typeof notes === 'string' && notes.length > 1000) {
      return res.status(400).json({ error: 'notes must be at most 1000 characters' });
    }
    const lot = await lotsService.updateLot(Number(req.params.id), { ingredients, notes });
    if (!lot) return res.status(404).json({ error: 'Lot not found' });
    res.json(lot);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const deleted = await lotsService.deleteLot(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Lot not found' });
    res.status(204).send();
  } catch (err) { next(err); }
}
