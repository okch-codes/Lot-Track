import { Router } from 'express';
import * as controller from '../controllers/lots.controller';

const router = Router();

router.get('/', controller.getAll);
router.post('/next-number', controller.nextNumber);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;
