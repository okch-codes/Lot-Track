import { Request, Response, NextFunction } from 'express';
import * as lotsService from '../services/lots.service';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const lots = await lotsService.getAllLots(search, from, to);
    res.json(lots);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
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
    if (!recipe_id || !ingredients?.length) {
      return res.status(400).json({ error: 'recipe_id and ingredients are required' });
    }
    const lot = await lotsService.createLot({ recipe_id, ingredients, notes });
    res.status(201).json(lot);
  } catch (err: any) {
    if (err.message === 'A lot for this recipe already exists today') {
      return res.status(409).json({ error: err.message });
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { ingredients, notes } = req.body;
    if (!ingredients?.length) {
      return res.status(400).json({ error: 'ingredients are required' });
    }
    const lot = await lotsService.updateLot(Number(req.params.id), { ingredients, notes });
    if (!lot) return res.status(404).json({ error: 'Lot not found' });
    res.json(lot);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const deleted = await lotsService.deleteLot(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Lot not found' });
    res.status(204).send();
  } catch (err) { next(err); }
}
