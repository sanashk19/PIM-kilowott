import { describe, it, expect, beforeAll } from 'vitest';
import { AIGuardrailService } from '../services/ai/aiGuardrails.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { runSeed } from '../db/seed.js';

beforeAll(() => {
  runSeed();
});

describe('Deterministic AI Guardrails Pipeline', () => {
  it('Flags and blocks price jump >30% (PRICE_CHANGE_TOO_LARGE)', () => {
    const product = ProductRepository.getById(5)!; // Ambient Rhythm LED Light Bar (₹2,499)
    expect(product).toBeDefined();

    const changes = [
      { field: 'regular_price', before: 2499, after: 4999 }, // ~100% increase
    ];

    const report = AIGuardrailService.validate(product, changes);
    expect(report.valid).toBe(false);
    expect(report.blockedCount).toBeGreaterThan(0);

    const priceRule = report.rules.find(r => r.rule === 'PRICE_CHANGE_TOO_LARGE');
    expect(priceRule).toBeDefined();
    expect(priceRule?.passed).toBe(false);
    expect(priceRule?.blocked).toBe(true);
    expect(priceRule?.risk_level).toBe('HIGH');
  });

  it('Passes safe price changes within 30% threshold', () => {
    const product = ProductRepository.getById(1)!; // Apex Pro (₹8,999)
    const changes = [
      { field: 'regular_price', before: 8999, after: 9449 }, // +5%
    ];

    const report = AIGuardrailService.validate(product, changes);
    const priceRule = report.rules.find(r => r.rule === 'PRICE_CHANGE_TOO_LARGE');
    expect(priceRule?.passed).toBe(true);
    expect(priceRule?.blocked).toBe(false);
  });

  it('Blocks products with missing or blank SKU (MISSING_SKU)', () => {
    const product = ProductRepository.getById(1)!;
    const changes = [
      { field: 'sku', before: 'AUDIO-APX-001', after: '' },
    ];

    const report = AIGuardrailService.validate(product, changes);
    expect(report.valid).toBe(false);
    const skuRule = report.rules.find(r => r.rule === 'MISSING_SKU');
    expect(skuRule?.blocked).toBe(true);
  });

  it('Blocks products with negative stock quantity (INVALID_STOCK)', () => {
    const product = ProductRepository.getById(1)!;
    const changes = [
      { field: 'stock_quantity', before: 15, after: -5 },
    ];

    const report = AIGuardrailService.validate(product, changes);
    expect(report.valid).toBe(false);
    const stockRule = report.rules.find(r => r.rule === 'INVALID_STOCK');
    expect(stockRule?.blocked).toBe(true);
  });
});
