import { getDb } from './connection.js';

export function initializeSchema(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      sku TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'simple',
      status TEXT DEFAULT 'publish',
      regular_price REAL,
      sale_price REAL,
      stock_quantity INTEGER DEFAULT 0,
      manage_stock BOOLEAN DEFAULT 1,
      description TEXT,
      short_description TEXT,
      image_url TEXT,
      brand TEXT,
      woo_id INTEGER,
      sync_status TEXT DEFAULT 'not_synced',
      quality_score INTEGER DEFAULT 0,
      quality_issues TEXT,
      last_synced_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      woo_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS product_categories (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, category_id)
    );

    CREATE TABLE IF NOT EXISTS attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      type TEXT DEFAULT 'select',
      is_variation BOOLEAN DEFAULT 0,
      woo_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS attribute_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
      value TEXT NOT NULL,
      label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_attributes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      attribute_id INTEGER NOT NULL REFERENCES attributes(id) ON DELETE CASCADE,
      selected_values TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mock_woo_products (
      woo_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      sku TEXT,
      type TEXT DEFAULT 'simple',
      status TEXT DEFAULT 'publish',
      regular_price REAL,
      sale_price REAL,
      stock_quantity INTEGER DEFAULT 0,
      description TEXT,
      short_description TEXT,
      image_url TEXT,
      brand TEXT,
      categories_json TEXT,
      attributes_json TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      product_name TEXT,
      entity_type TEXT DEFAULT 'product',
      direction TEXT NOT NULL,
      action TEXT NOT NULL,
      status TEXT NOT NULL,
      changed_fields TEXT,
      request_payload TEXT,
      response_payload TEXT,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_agent_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      status TEXT NOT NULL,
      analysis_summary TEXT,
      proposed_patch TEXT NOT NULL,
      sync_plan TEXT,
      user_decision TEXT,
      applied_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}
