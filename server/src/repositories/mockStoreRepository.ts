import { getDb } from '../db/connection.js';
import { MockStoreProduct } from '../types/index.js';

export class MockStoreRepository {
  public static getAll(search?: string): MockStoreProduct[] {
    const db = getDb();
    let query = 'SELECT * FROM mock_woo_products';
    const params: any[] = [];

    if (search) {
      query += ' WHERE (name LIKE ? OR sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY woo_id DESC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => this.mapRow(r));
  }

  public static getById(wooId: number): MockStoreProduct | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM mock_woo_products WHERE woo_id = ?').get(wooId) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public static getBySku(sku: string): MockStoreProduct | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM mock_woo_products WHERE sku = ?').get(sku) as any;
    if (!row) return null;
    return this.mapRow(row);
  }

  public static create(data: Partial<MockStoreProduct>): MockStoreProduct {
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO mock_woo_products (
        name, slug, sku, type, status, regular_price, sale_price,
        stock_quantity, description, short_description, image_url,
        brand, categories_json, attributes_json
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?
      )
    `).run(
      data.name || 'Store Item',
      data.slug || 'item',
      data.sku || null,
      data.type || 'simple',
      data.status || 'publish',
      data.regular_price ? Number(data.regular_price) : 0,
      data.sale_price ? Number(data.sale_price) : null,
      data.stock_quantity ?? 0,
      data.description || null,
      data.short_description || null,
      data.image_url || (data.images && data.images[0]?.src) || null,
      (data as any).brand || null,
      data.categories ? JSON.stringify(data.categories) : null,
      data.attributes ? JSON.stringify(data.attributes) : null
    );

    return this.getById(Number(info.lastInsertRowid))!;
  }

  public static update(wooId: number, data: Partial<MockStoreProduct>): MockStoreProduct | null {
    const db = getDb();
    const existing = this.getById(wooId);
    if (!existing) return null;

    db.prepare(`
      UPDATE mock_woo_products SET
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        sku = COALESCE(?, sku),
        regular_price = COALESCE(?, regular_price),
        sale_price = ?,
        stock_quantity = COALESCE(?, stock_quantity),
        description = COALESCE(?, description),
        short_description = COALESCE(?, short_description),
        image_url = COALESCE(?, image_url),
        categories_json = COALESCE(?, categories_json),
        attributes_json = COALESCE(?, attributes_json),
        updated_at = CURRENT_TIMESTAMP
      WHERE woo_id = ?
    `).run(
      data.name ?? null,
      data.slug ?? null,
      data.sku ?? null,
      data.regular_price !== undefined ? Number(data.regular_price) : null,
      data.sale_price !== undefined ? (data.sale_price ? Number(data.sale_price) : null) : null,
      data.stock_quantity !== undefined ? Number(data.stock_quantity) : null,
      data.description ?? null,
      data.short_description ?? null,
      data.image_url || (data.images && data.images[0]?.src) || null,
      data.categories ? JSON.stringify(data.categories) : null,
      data.attributes ? JSON.stringify(data.attributes) : null,
      wooId
    );

    return this.getById(wooId);
  }

  public static delete(wooId: number): boolean {
    const db = getDb();
    const info = db.prepare('DELETE FROM mock_woo_products WHERE woo_id = ?').run(wooId);
    return info.changes > 0;
  }

  public static clear(): void {
    const db = getDb();
    db.prepare('DELETE FROM mock_woo_products').run();
  }

  private static mapRow(r: any): MockStoreProduct {
    return {
      id: r.woo_id,
      name: r.name,
      slug: r.slug,
      sku: r.sku || undefined,
      type: r.type || 'simple',
      status: r.status || 'publish',
      price: String(r.sale_price || r.regular_price || 0),
      regular_price: String(r.regular_price || 0),
      sale_price: r.sale_price ? String(r.sale_price) : undefined,
      stock_quantity: r.stock_quantity ?? 0,
      description: r.description || undefined,
      short_description: r.short_description || undefined,
      image_url: r.image_url || undefined,
      images: r.image_url ? [{ id: 1, src: r.image_url }] : [],
      categories: r.categories_json ? JSON.parse(r.categories_json) : [],
      attributes: r.attributes_json ? JSON.parse(r.attributes_json) : [],
      updated_at: r.updated_at,
    };
  }
}
