import { Request, Response } from 'express';
import { SyncService } from '../services/syncService.js';
import { SyncLogRepository } from '../repositories/syncLogRepository.js';
import { MockStoreRepository } from '../repositories/mockStoreRepository.js';

export class SyncController {
  public static async getPreFlightDiff(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    try {
      const diff = await SyncService.getPreFlightDiff(productId);
      res.json({
        success: true,
        data: diff,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async pushProduct(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.productId);
    if (isNaN(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    try {
      const result = await SyncService.pushProduct(productId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({
        success: false,
        message: err.message || 'Synchronization failed',
      });
    }
  }

  public static async pushBatch(req: Request, res: Response): Promise<void> {
    const { product_ids } = req.body;
    if (!Array.isArray(product_ids)) {
      res.status(422).json({ success: false, message: 'product_ids array required' });
      return;
    }

    try {
      const result = await SyncService.pushBatch(product_ids);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async resolveConflict(req: Request, res: Response): Promise<void> {
    const { product_id, resolution } = req.body;
    if (!product_id || (resolution !== 'keep_pim' && resolution !== 'keep_woo')) {
      res.status(422).json({ success: false, message: 'Valid product_id and resolution (keep_pim or keep_woo) required' });
      return;
    }

    try {
      const result = await SyncService.resolveConflict(Number(product_id), resolution);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async importProduct(req: Request, res: Response): Promise<void> {
    const wooId = Number(req.params.wooId);
    if (isNaN(wooId)) {
      res.status(400).json({ success: false, message: 'Invalid woo_id' });
      return;
    }

    try {
      const product = await SyncService.importProduct(wooId);
      res.json({
        success: true,
        message: `Successfully imported WooCommerce product ${wooId} into VERIDEX.`,
        data: product,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async importAll(_req: Request, res: Response): Promise<void> {
    try {
      const result = await SyncService.importAll();
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static getLogs(req: Request, res: Response): void {
    const status = req.query.status as string | undefined;
    const direction = req.query.direction as string | undefined;

    const logs = SyncLogRepository.getAll({ status, direction, limit: 100 });
    res.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  }

  public static async rollback(req: Request, res: Response): Promise<void> {
    const logId = Number(req.params.logId);
    if (isNaN(logId)) {
      res.status(400).json({ success: false, message: 'Invalid sync log ID' });
      return;
    }

    try {
      const result = await SyncService.rollbackSync(logId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Rollback failed' });
    }
  }

  public static getPolicies(_req: Request, res: Response): void {
    try {
      const policies = PolicyService.getPolicies();
      res.json({ success: true, data: policies });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static updatePolicies(req: Request, res: Response): void {
    try {
      const updated = PolicyService.updatePolicies(req.body);
      res.json({ success: true, message: 'Source-of-truth policies updated', data: updated });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static getMockStoreProducts(req: Request, res: Response): void {
    const search = req.query.search as string | undefined;
    const products = MockStoreRepository.getAll(search);
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  }
}
