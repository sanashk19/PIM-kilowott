import { getDb } from '../db/connection.js';
import { SyncLog } from '../types/index.js';

export class SyncLogRepository {
  public static getAll(filters: { status?: string; direction?: string; limit?: number } = {}): SyncLog[] {
    const db = getDb();
    let query = 'SELECT * FROM sync_logs';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters.status && filters.status !== 'all') {
      conditions.push('status = ?');
      params.push(filters.status);
    }

    if (filters.direction && filters.direction !== 'all') {
      conditions.push('direction = ?');
      params.push(filters.direction);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(filters.limit || 50);

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => ({
      id: r.id,
      product_id: r.product_id,
      product_name: r.product_name,
      entity_type: r.entity_type,
      direction: r.direction,
      action: r.action,
      status: r.status,
      changed_fields: r.changed_fields ? JSON.parse(r.changed_fields) : [],
      request_payload: r.request_payload ? JSON.parse(r.request_payload) : null,
      response_payload: r.response_payload ? JSON.parse(r.response_payload) : null,
      error_message: r.error_message,
      created_at: r.created_at,
    }));
  }

  public static create(log: Omit<SyncLog, 'id' | 'created_at'>): SyncLog {
    const db = getDb();
    const info = db.prepare(`
      INSERT INTO sync_logs (
        product_id, product_name, entity_type, direction, action,
        status, changed_fields, request_payload, response_payload, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      log.product_id || null,
      log.product_name || null,
      log.entity_type || 'product',
      log.direction,
      log.action,
      log.status,
      log.changed_fields ? JSON.stringify(log.changed_fields) : null,
      log.request_payload ? JSON.stringify(log.request_payload) : null,
      log.response_payload ? JSON.stringify(log.response_payload) : null,
      log.error_message || null
    );

    const created = db.prepare('SELECT * FROM sync_logs WHERE id = ?').get(info.lastInsertRowid) as any;
    return {
      id: created.id,
      product_id: created.product_id,
      product_name: created.product_name,
      entity_type: created.entity_type,
      direction: created.direction,
      action: created.action,
      status: created.status,
      changed_fields: created.changed_fields ? JSON.parse(created.changed_fields) : [],
      request_payload: created.request_payload ? JSON.parse(created.request_payload) : null,
      response_payload: created.response_payload ? JSON.parse(created.response_payload) : null,
      error_message: created.error_message,
      created_at: created.created_at,
    };
  }
}
