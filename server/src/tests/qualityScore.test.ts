import { describe, it, expect } from 'vitest';
import { QualityScoreService } from '../services/qualityScoreService.js';

describe('QualityScoreService', () => {
  it('should award a high score (~95+) for a complete product', () => {
    const assessment = QualityScoreService.assess({
      sku: 'AUDIO-TEST-001',
      name: 'High-Fidelity Studio Headphones',
      regular_price: 9999,
      sale_price: 7999,
      description: 'Comprehensive high-fidelity acoustic profile with exceptional frequency response across all spectra and ultra-soft memory foam ear cushions.',
      short_description: 'Studio-grade headphones with 45mm drivers.',
      image_url: 'https://example.com/headphones.jpg',
      brand: 'StudioSound',
      stock_quantity: 25,
      categories: [{ id: 1, name: 'Audio', slug: 'audio' }],
      product_attributes: [{ attribute_id: 1, selected_values: ['Black'] }],
    });

    expect(assessment.score).toBeGreaterThanOrEqual(90);
    expect(assessment.rating).toBe('Excellent');
    expect(assessment.woo_ready).toBe(true);
    expect(assessment.issues.length).toBe(0);
    expect(assessment.checks.every(c => c.passed)).toBe(true);
  });

  it('should apply critical deduction (-25) for missing SKU', () => {
    const assessment = QualityScoreService.assess({
      sku: '',
      name: 'Generic Ergonomic Desk Chair',
      regular_price: 5000,
      description: 'Detailed description with sufficient length for testing product evaluation standards.',
      short_description: 'Ergonomic chair',
      image_url: 'https://example.com/chair.jpg',
      categories: [{ id: 1, name: 'Office', slug: 'office' }],
    });

    expect(assessment.score).toBeLessThanOrEqual(75);
    const skuIssue = assessment.issues.find(i => i.field === 'sku');
    expect(skuIssue).toBeDefined();
    expect(skuIssue?.severity).toBe('critical');
    expect(assessment.woo_ready).toBe(false);
  });

  it('should flag fatal error when sale price is higher than regular price', () => {
    const assessment = QualityScoreService.assess({
      sku: 'PROMO-ERR-001',
      name: 'Performance Running Trainers',
      regular_price: 3000,
      sale_price: 4500, // Invalid: sale > regular
      description: 'Technical running shoes designed for marathon athletes and long-distance trainers.',
      short_description: 'Breathable trainers',
      image_url: 'https://example.com/shoes.jpg',
      categories: [{ id: 1, name: 'Footwear', slug: 'footwear' }],
    });

    const priceIssue = assessment.issues.find(i => i.field === 'sale_price');
    expect(priceIssue).toBeDefined();
    expect(priceIssue?.severity).toBe('critical');
    expect(assessment.woo_ready).toBe(false);
  });

  it('should identify missing images and descriptions transparently', () => {
    const assessment = QualityScoreService.assess({
      sku: 'TEST-MIN-001',
      name: 'Simple Desk Lamp',
      regular_price: 1200,
      description: undefined,
      short_description: undefined,
      image_url: undefined,
      categories: [],
    });

    expect(assessment.score).toBeLessThanOrEqual(50);
    expect(assessment.rating).toBe('Poor');
    const fields = assessment.issues.map(i => i.field);
    expect(fields).toContain('description');
    expect(fields).toContain('image_url');
    expect(fields).toContain('categories');
  });
});
