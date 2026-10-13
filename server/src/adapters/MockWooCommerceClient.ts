import { WooCommerceClient, WooProductPayload, WooProductResponse } from './WooCommerceClient.js';
import { MockStoreRepository } from '../repositories/mockStoreRepository.js';
import { getDb } from '../db/connection.js';

export class MockWooCommerceClient implements WooCommerceClient {
  private checkSimulateFailure(): void {
    const db = getDb();
    const row = db.prepare("SELECT value FROM settings WHERE key = 'mock_woo_simulate_failure'").get() as any;
    if (row && row.value === 'true') {
      const error: any = new Error('WooCommerce API Error: 500 Internal Server Error (Simulated for demonstration)');
      error.status = 500;
      error.code = 'woocommerce_rest_cannot_sync';
      throw error;
    }
  }

  public async getProducts(params?: { search?: string; per_page?: number }): Promise<WooProductResponse[]> {
    this.checkSimulateFailure();
    const items = MockStoreRepository.getAll(params?.search);

    return items.map(item => this.toResponse(item));
  }

  public async getProduct(id: number): Promise<WooProductResponse | null> {
    this.checkSimulateFailure();
    const item = MockStoreRepository.getById(id);
    if (!item) return null;
    return this.toResponse(item);
  }

  public async createProduct(payload: WooProductPayload): Promise<WooProductResponse> {
    this.checkSimulateFailure();

    // Enforce WooCommerce REST API v3 constraints
    if (!payload.name) {
      throw new Error('WooCommerce REST Error: Product title is required (400 Bad Request)');
    }

    const created = MockStoreRepository.create({
      name: payload.name,
      slug: payload.slug || payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      sku: payload.sku || undefined,
      type: payload.type || 'simple',
      status: payload.status || 'publish',
      regular_price: payload.regular_price || '0',
      sale_price: payload.sale_price || undefined,
      stock_quantity: payload.stock_quantity ?? 0,
      description: payload.description || undefined,
      short_description: payload.short_description || undefined,
      image_url: payload.images && payload.images[0] ? payload.images[0].src : undefined,
      images: payload.images ? payload.images.map((img, idx) => ({ id: idx + 1, src: img.src })) : [],
      categories: payload.categories ? payload.categories.map((c, i) => ({ id: c.id || (i + 1), name: c.name || '', slug: c.slug || '' })) : [],
      attributes: payload.attributes ? payload.attributes.map(a => ({ name: a.name, options: a.options })) : [],
    });

    return this.toResponse(created);
  }

  public async updateProduct(id: number, payload: Partial<WooProductPayload>): Promise<WooProductResponse> {
    this.checkSimulateFailure();

    const existing = MockStoreRepository.getById(id);
    if (!existing) {
      throw new Error(`WooCommerce REST Error: Product with ID ${id} not found (404)`);
    }

    const updated = MockStoreRepository.update(id, {
      name: payload.name,
      slug: payload.slug,
      sku: payload.sku,
      regular_price: payload.regular_price,
      sale_price: payload.sale_price,
      stock_quantity: payload.stock_quantity,
      description: payload.description,
      short_description: payload.short_description,
      image_url: payload.images && payload.images[0] ? payload.images[0].src : undefined,
      images: payload.images ? payload.images.map((img, idx) => ({ id: idx + 1, src: img.src })) : undefined,
      categories: payload.categories ? payload.categories.map((c, i) => ({ id: c.id || (i + 1), name: c.name || '', slug: c.slug || '' })) : undefined,
      attributes: payload.attributes ? payload.attributes.map(a => ({ name: a.name, options: a.options })) : undefined,
    });

    if (!updated) {
      throw new Error(`Failed to update product ${id}`);
    }

    return this.toResponse(updated);
  }

  public async deleteProduct(id: number): Promise<{ id: number; message: string }> {
    this.checkSimulateFailure();
    const success = MockStoreRepository.delete(id);
    if (!success) {
      throw new Error(`Product ${id} not found`);
    }
    return { id, message: 'Permanently deleted WooCommerce product.' };
  }

  public async testConnection(): Promise<{ success: boolean; message: string; store_name?: string; products_count?: number }> {
    this.checkSimulateFailure();
    const count = MockStoreRepository.getAll().length;
    return {
      success: true,
      message: 'Successfully connected to Persistent Mock WooCommerce Sandbox API (v3)',
      store_name: 'Kilowatt Demo Sandbox Store (WooCommerce v8.6)',
      products_count: count,
    };
  }

  private toResponse(item: any): WooProductResponse {
    return {
      id: item.id,
      name: item.name,
      slug: item.slug,
      type: item.type || 'simple',
      status: item.status || 'publish',
      price: item.sale_price || item.regular_price || '0',
      regular_price: item.regular_price || '0',
      sale_price: item.sale_price || '',
      sku: item.sku || '',
      stock_quantity: item.stock_quantity ?? 0,
      description: item.description || '',
      short_description: item.short_description || '',
      images: item.images || (item.image_url ? [{ id: 1, src: item.image_url }] : []),
      categories: item.categories || [],
      attributes: item.attributes || [],
      date_created: item.created_at || new Date().toISOString(),
      date_modified: item.updated_at || new Date().toISOString(),
    };
  }
}
