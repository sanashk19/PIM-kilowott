import { Router } from 'express';
import { ProductController } from '../controllers/productController.js';

export const productRouter = Router();

productRouter.get('/', ProductController.getAll);
productRouter.post('/', ProductController.create);
productRouter.get('/:id', ProductController.getById);
productRouter.put('/:id', ProductController.update);
productRouter.delete('/:id', ProductController.delete);
productRouter.post('/recalculate-scores', ProductController.recalculateQuality);
