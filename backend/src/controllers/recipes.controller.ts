import { Request, Response, NextFunction } from 'express';
import * as recipesService from '../services/recipes.service';
import { isNonEmptyString, isPositiveInt } from '../utils/validate';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const result = await recipesService.getAllRecipes(search, page, limit);
    res.json(result);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const recipe = await recipesService.getRecipeById(Number(req.params.id));
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, ingredients } = req.body;
    if (!isNonEmptyString(name, 200)) {
      return res.status(400).json({ error: 'name must be a non-empty string (max 200 chars)' });
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0 || ingredients.length > 100) {
      return res.status(400).json({ error: 'ingredients must be an array with 1-100 items' });
    }
    for (const ing of ingredients) {
      if (!isNonEmptyString(ing, 200)) {
        return res.status(400).json({ error: 'Each ingredient must be a non-empty string (max 200 chars)' });
      }
    }
    const recipe = await recipesService.createRecipe(name, ingredients);
    res.status(201).json(recipe);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A recipe with this name already exists' });
    }
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const { name, ingredients } = req.body;
    if (!isNonEmptyString(name, 200)) {
      return res.status(400).json({ error: 'name must be a non-empty string (max 200 chars)' });
    }
    if (!Array.isArray(ingredients) || ingredients.length === 0 || ingredients.length > 100) {
      return res.status(400).json({ error: 'ingredients must be an array with 1-100 items' });
    }
    for (const ing of ingredients) {
      if (!isNonEmptyString(ing, 200)) {
        return res.status(400).json({ error: 'Each ingredient must be a non-empty string (max 200 chars)' });
      }
    }
    const recipe = await recipesService.updateRecipe(Number(req.params.id), name, ingredients);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A recipe with this name already exists' });
    }
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const deleted = await recipesService.deleteRecipe(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: 'Recipe not found' });
    res.status(204).send();
  } catch (err: any) {
    if (err.code === '23503') {
      return res.status(409).json({ error: 'Recipe is referenced by a lot and cannot be deleted' });
    }
    next(err);
  }
}

export async function getIngredientsWithLots(req: Request, res: Response, next: NextFunction) {
  try {
    if (!isPositiveInt(req.params.id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const ingredients = await recipesService.getRecipeIngredientsWithLots(Number(req.params.id));
    res.json(ingredients);
  } catch (err) { next(err); }
}
