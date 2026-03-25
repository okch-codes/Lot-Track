import { Request, Response, NextFunction } from 'express';
import * as costsService from '../services/costs.service';
import { isPositiveInt } from '../utils/validate';

export async function getIngredients(_req: Request, res: Response, next: NextFunction) {
  try {
    const ingredients = await costsService.getIngredientsWithCosts();
    res.json(ingredients);
  } catch (err) { next(err); }
}

export async function patchIngredientCost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const ingredient = await costsService.updateIngredientCost(Number(req.params.id), req.body);
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    res.json(ingredient);
  } catch (err) { next(err); }
}

export async function getRecipeCost(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.recipeId)) {
      return res.status(400).json({ error: 'Invalid recipeId' });
    }
    const result = await costsService.getRecipeCost(Number(req.params.recipeId));
    if (!result) return res.status(404).json({ error: 'Recipe not found' });
    res.json(result);
  } catch (err) { next(err); }
}

export async function upsertCostItem(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.recipeId)) {
      return res.status(400).json({ error: 'Invalid recipeId' });
    }
    const { ingredient_id, quantity } = req.body;
    if (!isPositiveInt(ingredient_id)) {
      return res.status(400).json({ error: 'ingredient_id is required' });
    }
    if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'quantity must be >= 0' });
    }
    await costsService.upsertRecipeCostItem(Number(req.params.recipeId), ingredient_id, quantity);
    res.status(204).send();
  } catch (err) { next(err); }
}

export async function updateRecipeYield(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.recipeId)) {
      return res.status(400).json({ error: 'Invalid recipeId' });
    }
    const { cost_yield, cost_yield_unit } = req.body;
    const recipe = await costsService.updateRecipeYield(
      Number(req.params.recipeId),
      cost_yield ?? null,
      cost_yield_unit ?? null
    );
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) { next(err); }
}
