import { getDb } from '../db/connection.js';
import { Attribute, AttributeOption } from '../types/index.js';

export class AttributeRepository {
  public static getAll(): Attribute[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM attributes ORDER BY name ASC').all() as any[];

    const attributes: Attribute[] = [];
    for (const r of rows) {
      const options = db.prepare('SELECT * FROM attribute_options WHERE attribute_id = ?').all(r.id) as AttributeOption[];
      attributes.push({
        id: r.id,
        name: r.name,
        slug: r.slug,
        type: r.type,
        is_variation: Boolean(r.is_variation),
        woo_id: r.woo_id || undefined,
        options,
      });
    }
    return attributes;
  }

  public static getById(id: number): Attribute | null {
    const db = getDb();
    const r = db.prepare('SELECT * FROM attributes WHERE id = ?').get(id) as any;
    if (!r) return null;
    const options = db.prepare('SELECT * FROM attribute_options WHERE attribute_id = ?').all(r.id) as AttributeOption[];
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      type: r.type,
      is_variation: Boolean(r.is_variation),
      woo_id: r.woo_id || undefined,
      options,
    };
  }

  public static create(data: { name: string; slug?: string; type?: string; is_variation?: boolean; woo_id?: number; options?: string[] }): Attribute {
    const db = getDb();
    const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const insertTx = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO attributes (name, slug, type, is_variation, woo_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(data.name, slug, data.type || 'select', data.is_variation ? 1 : 0, data.woo_id || null);

      const attributeId = Number(info.lastInsertRowid);
      const createdOptions: AttributeOption[] = [];

      if (data.options && data.options.length > 0) {
        const optionStmt = db.prepare('INSERT INTO attribute_options (attribute_id, value, label) VALUES (?, ?, ?)');
        for (const opt of data.options) {
          const optInfo = optionStmt.run(attributeId, opt, opt);
          createdOptions.push({
            id: Number(optInfo.lastInsertRowid),
            attribute_id: attributeId,
            value: opt,
            label: opt,
          });
        }
      }

      return {
        id: attributeId,
        name: data.name,
        slug,
        type: data.type || 'select',
        is_variation: Boolean(data.is_variation),
        woo_id: data.woo_id,
        options: createdOptions,
      };
    });

    return insertTx();
  }

  public static addOption(attributeId: number, value: string, label?: string): AttributeOption {
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO attribute_options (attribute_id, value, label)
      VALUES (?, ?, ?)
    `).run(attributeId, value, label || value);

    return {
      id: Number(info.lastInsertRowid),
      attribute_id: attributeId,
      value,
      label: label || value,
    };
  }

  public static delete(id: number): boolean {
    const db = getDb();
    const info = db.prepare('DELETE FROM attributes WHERE id = ?').run(id);
    return info.changes > 0;
  }
}
