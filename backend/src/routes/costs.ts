import { Router } from 'express';
import * as controller from '../controllers/costs.controller';

const router = Router();

router.get('/ingredients', controller.getIngredients);
router.patch('/ingredients/:id', controller.patchIngredientCost);
router.get('/recipes/:recipeId', controller.getRecipeCost);
router.put('/recipes/:recipeId/items', controller.upsertCostItem);
router.patch('/recipes/:recipeId/yield', controller.updateRecipeYield);
router.post('/scan-invoice', controller.scanInvoice);

export default router;
