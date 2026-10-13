import { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { WooCommerceFactory } from '../adapters/WooCommerceFactory.js';
import { runSeed } from '../db/seed.js';

export class SettingsController {
  public static getSettings(_req: Request, res: Response): void {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM settings').all() as any[];

    const map: Record<string, string> = {};
    for (const r of rows) {
      map[r.key] = r.value;
    }

    res.json({
      success: true,
      data: {
        woo_active_driver: (map['woo_active_driver'] || 'mock') as 'mock' | 'live',
        woo_store_url: map['woo_store_url'] || 'https://demo-woocommerce.local',
        woo_consumer_key: map['woo_consumer_key'] || 'ck_demo_key',
        woo_consumer_secret: map['woo_consumer_secret'] || 'cs_demo_secret',
        mock_woo_simulate_failure: map['mock_woo_simulate_failure'] === 'true',
      },
    });
  }

  public static updateSettings(req: Request, res: Response): void {
    const db = getDb();
    const {
      woo_active_driver,
      woo_store_url,
      woo_consumer_key,
      woo_consumer_secret,
      mock_woo_simulate_failure,
    } = req.body;

    const upsertStmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    db.transaction(() => {
      if (woo_active_driver !== undefined) upsertStmt.run('woo_active_driver', String(woo_active_driver));
      if (woo_store_url !== undefined) upsertStmt.run('woo_store_url', String(woo_store_url));
      if (woo_consumer_key !== undefined) upsertStmt.run('woo_consumer_key', String(woo_consumer_key));
      if (woo_consumer_secret !== undefined) upsertStmt.run('woo_consumer_secret', String(woo_consumer_secret));
      if (mock_woo_simulate_failure !== undefined) {
        upsertStmt.run('mock_woo_simulate_failure', mock_woo_simulate_failure ? 'true' : 'false');
      }
    })();

    res.json({
      success: true,
      message: 'Integration settings saved successfully.',
    });
  }

  public static async testConnection(_req: Request, res: Response): Promise<void> {
    const client = WooCommerceFactory.getClient();
    try {
      const result = await client.testConnection();
      res.json({
        success: true,
        data: {
          ...result,
          driver: client.constructor.name === 'MockWooCommerceClient' ? 'mock' : 'live',
        },
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Connection test failed',
      });
    }
  }

  public static resetMockStore(_req: Request, res: Response): void {
    runSeed();
    res.json({
      success: true,
      message: 'Mock WooCommerce store sandbox reset and re-seeded successfully.',
    });
  }
}
