import { describe, it, expect, beforeAll } from 'vitest';
import { SyncService } from '../services/syncService.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { SyncLogRepository } from '../repositories/syncLogRepository.js';
import { runSeed } from '../db/seed.js';

beforeAll(() => {
  runSeed();
});

describe('One-Click Rollback & Immutable Audit Ledger', () => {
  it('Successfully rolls back a product to its previous snapshot and creates a new immutable audit record', async () => {
    // Check initial state of Product 1
    const initialProduct = ProductRepository.getById(1)!;
    expect(initialProduct.regular_price).toBe(8999);

    // Get the seeded log for Product 1 (previous price was 7499)
    const logs = SyncLogRepository.getAll({ limit: 10 });
    const log1 = logs.find(l => l.product_id === 1 && l.previous_snapshot);
    expect(log1).toBeDefined();

    const initialLogCount = logs.length;

    // Execute rollback
    const rollbackRes = await SyncService.rollbackSync(log1!.id);
    expect(rollbackRes.success).toBe(true);
    expect(rollbackRes.product.regular_price).toBe(7499);

    // Verify product in database is restored
    const restoredProduct = ProductRepository.getById(1)!;
    expect(restoredProduct.regular_price).toBe(7499);

    // Verify a NEW audit record was appended and the original log was NOT deleted
    const updatedLogs = SyncLogRepository.getAll({ limit: 20 });
    expect(updatedLogs.length).toBe(initialLogCount + 1);

    const rollbackLog = updatedLogs[0]; // Most recent
    expect(rollbackLog.action).toBe('rollback');
    expect(rollbackLog.direction).toBe('rollback');
    expect(rollbackLog.status).toBe('success');

    // Verify original log still exists untouched
    const originalLog = SyncLogRepository.getById(log1!.id);
    expect(originalLog).toBeDefined();
    expect(originalLog?.id).toBe(log1!.id);
  });
});
