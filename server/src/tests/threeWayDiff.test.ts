import { describe, it, expect, beforeAll } from 'vitest';
import { SyncService } from '../services/syncService.js';
import { runSeed } from '../db/seed.js';

beforeAll(() => {
  runSeed();
});

describe('Three-Way Diff Engine & Conflict Detection', () => {
  it('Scenario 1: Detects PIM_CHANGED when PIM price changed vs baseline while WooCommerce is unchanged', async () => {
    // Product 1: Apex Pro Wireless Headphones
    // Baseline: ₹7,499, PIM: ₹8,999, Woo: ₹7,499
    const diffRes = await SyncService.getPreFlightDiff(1);
    expect(diffRes.has_changes).toBe(true);

    const priceDiff = diffRes.diffs.find(d => d.field === 'regular_price');
    expect(priceDiff).toBeDefined();
    expect(priceDiff?.three_way_status).toBe('PIM_CHANGED');
    expect(priceDiff?.recommended_resolution).toBe('keep_pim');
    expect(priceDiff?.is_different).toBe(true);
  });

  it('Scenario 2: Detects WOO_CHANGED when WooCommerce inventory stock changed vs baseline', async () => {
    // Product 2: KeyCraft Mechanical Keyboard
    // Baseline stock: 25, PIM stock: 25, Woo stock: 12
    const diffRes = await SyncService.getPreFlightDiff(2);
    expect(diffRes.has_changes).toBe(true);

    const stockDiff = diffRes.diffs.find(d => d.field === 'stock_quantity');
    expect(stockDiff).toBeDefined();
    expect(stockDiff?.three_way_status).toBe('WOO_CHANGED');
    expect(stockDiff?.recommended_resolution).toBe('keep_woo');
  });

  it('Scenario 3: Detects CONFLICT when both PIM and WooCommerce modified description differently', async () => {
    // Product 3: Leather Crossbody Bag
    // Baseline: baseBagDesc, PIM: pimBagDesc, Woo: wooBagDesc
    const diffRes = await SyncService.getPreFlightDiff(3);
    expect(diffRes.has_conflicts).toBe(true);

    const descDiff = diffRes.diffs.find(d => d.field === 'description');
    expect(descDiff).toBeDefined();
    expect(descDiff?.three_way_status).toBe('CONFLICT');
    expect(descDiff?.policy_owner).toBe('PIM');
    expect(descDiff?.recommended_resolution).toBe('keep_pim');
  });

  it('Scenario 6: Detects MATCH when PIM == BASELINE == WooCommerce', async () => {
    // Product 6: AeroPress Travel Brew Kit
    const diffRes = await SyncService.getPreFlightDiff(6);
    expect(diffRes.has_conflicts).toBe(false);

    const priceDiff = diffRes.diffs.find(d => d.field === 'regular_price');
    expect(priceDiff?.three_way_status).toBe('MATCH');
    expect(priceDiff?.is_different).toBe(false);

    const stockDiff = diffRes.diffs.find(d => d.field === 'stock_quantity');
    expect(stockDiff?.three_way_status).toBe('MATCH');
  });
});
