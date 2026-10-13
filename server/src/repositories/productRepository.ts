import { getDb } from '../db/connection.js';
import { Product, Category, ProductAttributeItem, QualityIssue } from '../types/index.js';

export class ProductRepository {
  private static hydrateProduct(r: any, db: any): Product {
    // Categories
    const categories = db.prepare(`
      SELECT c.* FROM categories c
      INNER JOIN product_categories pc ON c.id = pc.category_id
      WHERE pc.product_id = ?
    `).all(r.id) as Category[];

    // Product Attributes
    const attributeRows = db.prepare(`
      SELECT pa.id, pa.attribute_id, pa.selected_values,
             a.name, a.slug, a.type, a.is_variation, a.woo_id
      FROM product_attributes pa
      INNER JOIN attributes a ON pa.attribute_id = a.id
      WHERE pa.product_id = ?
    `).all(r.id) as any[];

    const product_attributes: ProductAttributeItem[] = attributeRows.map(ar => ({
      id: ar.id,
      attribute_id: ar.attribute_id,
      selected_values: JSON.parse(ar.selected_values || '[]'),
      attribute: {
        id: ar.attribute_id,
        name: ar.name,
        slug: ar.slug,
        type: ar.type,
        is_variation: Boolean(ar.is_variation),
        woo_id: ar.woo_id || undefined,
      },
    }));

    let quality_issues: QualityIssue[] | undefined;
    if (r.quality_issues) {
      try {
        quality_issues = JSON.parse(r.quality_issues);
      } catch {
        quality_issues = undefined;
      }
    }

    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku,
      type: r.type || 'simple',
      status: r.status || 'publish',
      regular_price: r.regular_price !== null ? Number(r.regular_price) : null,
      sale_price: r.sale_price !== null ? Number(r.sale_price) : null,
      stock_quantity: r.stock_quantity !== null ? Number(r.stock_quantity) : 0,
      manage_stock: Boolean(r.manage_stock),
      description: r.description || undefined,
      short_description: r.short_description || undefined,
      image_url: r.image_url || undefined,
      brand: r.brand || undefined,
      woo_id: r.woo_id || null,
      sync_status: r.sync_status || 'not_synced',
      quality_score: r.quality_score !== null ? Number(r.quality_score) : 0,
      quality_issues,
      last_synced_at: r.last_synced_at || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      categories,
      product_attributes,
    };
  }

  public static getAll(filters: { search?: string; sync_status?: string; category_id?: number } = {}): Product[] {
    const db = getDb();
    let query = 'SELECT p.* FROM products p';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.category_id) {
      query += ' INNER JOIN product_categories pc ON p.id = pc.product_id';
      conditions.push('pc.category_id = ?');
      params.push(filters.category_id);
    }

    if (filters.search) {
      conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.brand LIKE ?)');
      const term = `%${filters.search}%`;
      params.push(term, term, term);
    }

    if (filters.sync_status && filters.sync_status !== 'all') {
      conditions.push('p.sync_status = ?');
      params.push(filters.sync_status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.id DESC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => this.hydrateProduct(r, db));
  }

  public static getById(id: number): Product | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.hydrateProduct(row, db);
  }

  public static getBySku(sku: string): Product | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM products WHERE sku = ?').get(sku) as any;
    if (!row) return null;
    return this.hydrateProduct(row, db);
  }

  public static create(
    data: Partial<Product>,
    categoryIds: number[] = [],
    attributes: Array<{ attribute_id: number; selected_values: string[] }> = []
  ): Product {
    const db = getDb();
    const slug = data.slug || data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`;

    const tx = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO products (
          name, slug, sku, type, status, regular_price, sale_price,
          stock_quantity, manage_stock, description, short_description,
          image_url, brand, woo_id, sync_status, quality_score, quality_issues
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        )
      `);

      const info = stmt.run(
        data.name || 'Untitled Product',
        slug,
        data.sku || `SKU-${Date.now()}`,
        data.type || 'simple',
        data.status || 'publish',
        data.regular_price ?? null,
        data.sale_price ?? null,
        data.stock_quantity ?? 0,
        data.manage_stock ? 1 : 0,
        data.description || null,
        data.short_description || null,
        data.image_url || null,
        data.brand || null,
        data.woo_id || null,
        data.sync_status || 'not_synced',
        data.quality_score ?? 0,
        data.quality_issues ? JSON.stringify(data.quality_issues) : null
      );

      const productId = Number(info.lastInsertRowid);

      // Categories
      if (categoryIds && categoryIds.length > 0) {
        const catStmt = db.prepare('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)');
        for (const catId of categoryIds) {
          catStmt.run(productId, catId);
        }
      }

      // Attributes
      if (attributes && attributes.length > 0) {
        const attrStmt = db.prepare('INSERT INTO product_attributes (product_id, attribute_id, selected_values) VALUES (?, ?, ?)');
        for (const attr of attributes) {
          attrStmt.run(productId, attr.attribute_id, JSON.stringify(attr.selected_values));
        }
      }

      return productId;
    });

    const newId = tx();
    return this.getById(newId)!;
  }

  public static update(
    id: number,
    data: Partial<Product>,
    categoryIds?: number[],
    attributes?: Array<{ attribute_id: number; selected_values: string[] }>
  ): Product | null {
    const db = getDb();
    const existing = this.getById(id);
    if (!existing) return null;

    const tx = db.transaction(() => {
      const fields: string[] = [];
      const params: any[] = [];

      const updatableKeys: (keyof Product)[] = [
        'name', 'slug', 'sku', 'type', 'status', 'regular_price', 'sale_price',
        'stock_quantity', 'manage_stock', 'description', 'short_description',
        'image_url', 'brand', 'woo_id', 'sync_status', 'quality_score',
        'last_synced_at'
      ];

      for (const key of updatableKeys) {
        if (data[key] !== undefined) {
          fields.push(`${key} = ?`);
          if (key === 'manage_stock') {
            params.push(data[key] ? 1 : 0);
          } else {
            params.push(data[key]);
          }
        }
      }

      if (data.quality_issues !== undefined) {
        fields.push('quality_issues = ?');
        params.push(data.quality_issues ? JSON.stringify(data.quality_issues) : null);
      }

      fields.push("updated_at = CURRENT_TIMESTAMP");

      if (fields.length > 0) {
        const query = `UPDATE products SET ${fields.join(', ')} WHERE id = ?`;
        params.push(id);
        db.prepare(query).run(...params);
      }

      if (categoryIds !== undefined) {
        db.prepare('DELETE FROM product_categories WHERE product_id = ?').run(id);
        const catStmt = db.prepare('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)');
        for (const catId of categoryIds) {
          catStmt.run(id, catId);
        }
      }

      if (attributes !== undefined) {
        db.prepare('DELETE FROM product_attributes WHERE product_id = ?').run(id);
        const attrStmt = db.prepare('INSERT INTO product_attributes (product_id, attribute_id, selected_values) VALUES (?, ?, ?)');
        for (const attr of attributes) {
          attrStmt.run(id, attr.attribute_id, JSON.stringify(attr.selected_values));
        }
      }
    });

    tx();
    return this.getById(id);
  }

  public static delete(id: number): boolean {
    const db = getDb();
    const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
    return info.changes > 0;
  }
}
