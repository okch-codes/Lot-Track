import { Router } from 'express';
import * as controller from '../controllers/planning.controller';

const router = Router();

router.get('/', controller.getEvents);
router.post('/', controller.createEvent);
router.get('/:eventId', controller.getEventGrid);
router.put('/:eventId', controller.updateEvent);
router.delete('/:eventId', controller.deleteEvent);

router.post('/:eventId/columns', controller.createColumn);
router.delete('/:eventId/columns', controller.deleteColumn);
router.post('/:eventId/orders', controller.createOrder);
router.patch('/:eventId/orders/:orderId', controller.patchOrder);
router.delete('/:eventId/orders/:orderId', controller.deleteOrder);
router.put('/:eventId/orders/:orderId/items', controller.upsertItem);

export default router;
