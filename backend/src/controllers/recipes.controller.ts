import { Request, Response, NextFunction } from 'express';
import * as recipesService from '../services/recipes.service';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const search = req.query.search as string | undefined;
    const recipes = await recipesService.getAllRecipes(search);
    res.json(recipes);
  } catch (err) { next(err); }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const recipe = await recipesService.getRecipeById(Number(req.params.id));
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, ingredients } = req.body;
    if (!name || !ingredients?.length) {
      return res.status(400).json({ error: 'name and ingredients are required' });
    }
    const recipe = await recipesService.createRecipe(name, ingredients);
    res.status(201).json(recipe);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, ingredients } = req.body;
    if (!name || !ingredients?.length) {
      return res.status(400).json({ error: 'name and ingredients are required' });
    }
    const recipe = await recipesService.updateRecipe(Number(req.params.id), name, ingredients);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json(recipe);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
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
    const ingredients = await recipesService.getRecipeIngredientsWithLots(Number(req.params.id));
    res.json(ingredients);
  } catch (err) { next(err); }
}
