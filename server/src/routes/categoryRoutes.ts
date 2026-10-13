import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController.js';

export const categoryRouter = Router();

categoryRouter.get('/', CategoryController.getAll);
categoryRouter.post('/', CategoryController.create);
