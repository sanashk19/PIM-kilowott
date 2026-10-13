import { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { SyncLogRepository } from '../repositories/syncLogRepository.js';
import { MockStoreRepository } from '../repositories/mockStoreRepository.js';
import { config } from '../config/env.js';
import { DashboardStats } from '../types/index.js';

export class DashboardController {
  public static getStats(req: Request, res: Response): void {
    const db = getDb();

    const total = (db.prepare('SELECT COUNT(*) as count FROM products').get() as any).count || 0;
    const synced = (db.prepare("SELECT COUNT(*) as count FROM products WHERE sync_status = 'synced'").get() as any).count || 0;
    const modified = (db.prepare("SELECT COUNT(*) as count FROM products WHERE sync_status = 'modified'").get() as any).count || 0;
    const error = (db.prepare("SELECT COUNT(*) as count FROM products WHERE sync_status = 'error'").get() as any).count || 0;
    const not_synced = (db.prepare("SELECT COUNT(*) as count FROM products WHERE sync_status = 'not_synced'").get() as any).count || 0;
    const needs_attention = (db.prepare("SELECT COUNT(*) as count FROM products WHERE quality_score < 75").get() as any).count || 0;

    const mockCount = MockStoreRepository.getAll().length;

    const avgScoreRow = db.prepare('SELECT AVG(quality_score) as avg_score FROM products').get() as any;
    const avg_quality_score = avgScoreRow && avgScoreRow.avg_score !== null ? Math.round(Number(avgScoreRow.avg_score)) : 0;

    // Sync health percentage: based on percentage of products that are synced cleanly without error
    const sync_health_percentage = total > 0 ? Math.round(((synced) / total) * 100) : 100;

    const recent_logs = SyncLogRepository.getAll({ limit: 8 });
    const recent_products = ProductRepository.getAll().slice(0, 6);

    // Retrieve settings
    const simFailRow = db.prepare("SELECT value FROM settings WHERE key = 'mock_woo_simulate_failure'").get() as any;
    const simulate_failure = simFailRow ? simFailRow.value === 'true' : config.woo.simulateFailure;

    const driverRow = db.prepare("SELECT value FROM settings WHERE key = 'woo_active_driver'").get() as any;
    const driver = (driverRow ? driverRow.value : config.woo.activeDriver) as 'mock' | 'live';

    const data: DashboardStats = {
      counts: {
        total,
        synced,
        modified,
        error,
        not_synced,
        mock_store: mockCount,
        needs_attention,
      },
      sync_health_percentage,
      avg_quality_score,
      driver,
      simulate_failure,
      recent_logs,
      recent_products,
    };

    res.json({
      success: true,
      data,
    });
  }
}
