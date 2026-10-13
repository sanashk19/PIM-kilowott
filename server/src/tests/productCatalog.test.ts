import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { runSeed } from '../db/seed.js';

beforeAll(() => {
  // Seed the test database
  runSeed();
});

describe('Product Catalog API Vertical Slice', () => {
  it('GET /api/v1/products should return seeded products with quality scores', async () => {
    const res = await request(app).get('/api/v1/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(7);

    // Verify first product has quality score
    const p1 = res.body.data.find((p: any) => p.sku === 'AUDIO-APX-001');
    expect(p1).toBeDefined();
    expect(p1.quality_score).toBeGreaterThanOrEqual(90);
  });

  it('GET /api/v1/products/:id should return single product with detailed quality assessment', async () => {
    const res = await request(app).get('/api/v1/products/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain('Apex Pro');
    expect(res.body.data.quality_assessment).toBeDefined();
    expect(res.body.data.quality_assessment.checks.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/products should validate input with Zod and calculate quality score', async () => {
    const newProduct = {
      name: 'Smart Aeropress Travel Brew Kit',
      sku: 'COF-AERO-099',
      regular_price: 3499,
      sale_price: 2999,
      stock_quantity: 15,
      description: 'Compact espresso extraction press engineered for outdoor excursions, camping, and hotel travel.',
      short_description: 'Portable travel coffee press.',
      image_url: 'https://example.com/aeropress.jpg',
      brand: 'AeroCraft',
      category_ids: [6],
    };

    const res = await request(app).post('/api/v1/products').send(newProduct);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sku).toBe('COF-AERO-099');
    expect(res.body.data.quality_score).toBeGreaterThanOrEqual(80);
    expect(res.body.data.sync_status).toBe('not_synced');
  });

  it('POST /api/v1/products should return 422 if required fields are missing', async () => {
    const res = await request(app).post('/api/v1/products').send({
      description: 'Product without name and sku',
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('PUT /api/v1/products/:id should update product and transition sync_status to modified if previously synced', async () => {
    // Product 6 is synced
    const res = await request(app).put('/api/v1/products/6').send({
      regular_price: 3899,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.regular_price).toBe(3899);
    expect(res.body.data.sync_status).toBe('modified');
  });

  it('GET /api/v1/dashboard/stats should return accurate catalog KPIs', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.counts.total).toBeGreaterThanOrEqual(7);
    expect(res.body.data.avg_quality_score).toBeGreaterThan(0);
    expect(res.body.data.driver).toBe('mock');
  });
});
