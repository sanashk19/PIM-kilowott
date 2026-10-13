import { Router } from 'express';
import { AttributeController } from '../controllers/attributeController.js';

export const attributeRouter = Router();

attributeRouter.get('/', AttributeController.getAll);
attributeRouter.post('/', AttributeController.create);
attributeRouter.post('/:id/options', AttributeController.addOption);
attributeRouter.delete('/:id', AttributeController.delete);
