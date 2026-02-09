import { Router } from 'express';
import * as controller from '../controllers/ingredients.controller';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id/lot-history', controller.getLotHistory);
router.patch('/:id', controller.updateLastLotNumber);

export default router;
