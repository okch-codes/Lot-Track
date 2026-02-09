import { Request, Response, NextFunction } from 'express';
import * as ingredientsService from '../services/ingredients.service';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const ingredients = await ingredientsService.getAllIngredients(search);
    res.json(ingredients);
  } catch (err) { next(err); }
}

export async function getLotHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const history = await ingredientsService.getLotHistory(Number(req.params.id));
    res.json(history);
  } catch (err) { next(err); }
}

export async function updateLastLotNumber(req: Request, res: Response, next: NextFunction) {
  try {
    const { last_lot_number } = req.body;
    if (last_lot_number === undefined) {
      return res.status(400).json({ error: 'last_lot_number is required' });
    }
    const ingredient = await ingredientsService.updateLastLotNumber(
      Number(req.params.id),
      last_lot_number
    );
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    res.json(ingredient);
  } catch (err) { next(err); }
}
