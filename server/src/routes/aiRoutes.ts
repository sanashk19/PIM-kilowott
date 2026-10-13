import { Router } from 'express';
import { AIController } from '../controllers/aiController.js';

export const aiRouter = Router();

aiRouter.post('/analyze-product/:id', AIController.analyzeProduct);
aiRouter.post('/audit-catalog', AIController.auditCatalog);
aiRouter.post('/agent/plan/:id', AIController.agentPlan);
aiRouter.post('/agent/execute/:runId', AIController.agentExecute);
