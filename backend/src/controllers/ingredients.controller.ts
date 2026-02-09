import { Request, Response, NextFunction } from 'express';
import * as ingredientsService from '../services/ingredients.service';
import { isPositiveInt, isNonEmptyString } from '../utils/validate';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const result = await ingredientsService.getAllIngredients(search, page, limit);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getLotHistory(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const history = await ingredientsService.getLotHistory(Number(req.params.id));
    res.json(history);
  } catch (err) { next(err); }
}

export async function updateLastLotNumber(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { last_lot_number } = req.body;
    if (!isNonEmptyString(last_lot_number, 100)) {
      return res.status(400).json({ error: 'last_lot_number must be a non-empty string (max 100 chars)' });
    }
    const ingredient = await ingredientsService.updateLastLotNumber(
      Number(req.params.id),
      last_lot_number
    );
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    res.json(ingredient);
  } catch (err) { next(err); }
}
