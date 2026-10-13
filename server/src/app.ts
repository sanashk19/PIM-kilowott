import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { productRouter } from './routes/productRoutes.js';
import { categoryRouter } from './routes/categoryRoutes.js';
import { attributeRouter } from './routes/attributeRoutes.js';
import { dashboardRouter } from './routes/dashboardRoutes.js';
import { syncRouter } from './routes/syncRoutes.js';
import { settingsRouter } from './routes/settingsRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';

export const app = express();

app.use(cors());
app.use(express.json());

// API v1 routes
app.use('/api/v1/products', productRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/attributes', attributeRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/sync', syncRouter);
app.use('/api/v1/settings', settingsRouter);
app.use('/api/v1/ai', aiRouter);

// Root index endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'VERIDEX API Server',
    version: '1.0.0',
    health: '/health',
    api_prefix: '/api/v1',
    frontend: 'http://localhost:5173',
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'VERIDEX API', timestamp: new Date().toISOString() });
});

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error caught by global handler]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || undefined,
  });
});
