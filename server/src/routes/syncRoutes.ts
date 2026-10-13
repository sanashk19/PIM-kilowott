import { Router } from 'express';
import { SyncController } from '../controllers/syncController.js';

export const syncRouter = Router();

syncRouter.get('/diff/:productId', SyncController.getPreFlightDiff);
syncRouter.post('/push/:productId', SyncController.pushProduct);
syncRouter.post('/push-batch', SyncController.pushBatch);
syncRouter.post('/resolve-conflict', SyncController.resolveConflict);
syncRouter.post('/import/:wooId', SyncController.importProduct);
syncRouter.post('/import-all', SyncController.importAll);
syncRouter.get('/logs', SyncController.getLogs);
syncRouter.get('/mock-store-products', SyncController.getMockStoreProducts);
