import { Router } from 'express';
import { SettingsController } from '../controllers/settingsController.js';

export const settingsRouter = Router();

settingsRouter.get('/', SettingsController.getSettings);
settingsRouter.post('/', SettingsController.updateSettings);
settingsRouter.post('/test-connection', SettingsController.testConnection);
settingsRouter.post('/reset-mock-store', SettingsController.resetMockStore);
