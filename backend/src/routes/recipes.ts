import { Router } from 'express';
import * as controller from '../controllers/recipes.controller';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/ingredients-with-lots', controller.getIngredientsWithLots);

export default router;
