import { getDb } from '../db/connection.js';
import { Category } from '../types/index.js';

export class CategoryRepository {
  public static getAll(): Category[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT c.*, COUNT(pc.product_id) as products_count
      FROM categories c
      LEFT JOIN product_categories pc ON c.id = pc.category_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all() as any[];

    return rows.map(r => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description || undefined,
      woo_id: r.woo_id || undefined,
      products_count: r.products_count || 0,
    }));
  }

  public static getById(id: number): Category | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description || undefined,
      woo_id: row.woo_id || undefined,
    };
  }

  public static create(data: { name: string; slug?: string; description?: string; woo_id?: number }): Category {
    const db = getDb();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const info = db.prepare(`
      INSERT INTO categories (name, slug, description, woo_id)
      VALUES (?, ?, ?, ?)
    `).run(data.name, slug, data.description || null, data.woo_id || null);

    return {
      id: Number(info.lastInsertRowid),
      name: data.name,
      slug,
      description: data.description,
      woo_id: data.woo_id,
      products_count: 0,
    };
  }
}
