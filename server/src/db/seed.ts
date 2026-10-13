import { getDb } from './connection.js';
import { initializeSchema } from './schema.js';
import { QualityScoreService } from '../services/qualityScoreService.js';

export function runSeed(): void {
  initializeSchema();
  const db = getDb();

  console.log('🌱 Seeding PIM Sentinel enterprise database...');

  // Clear existing data
  db.exec(`
    DELETE FROM product_categories;
    DELETE FROM product_attributes;
    DELETE FROM attribute_options;
    DELETE FROM sync_logs;
    DELETE FROM ai_agent_runs;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM attributes;
    DELETE FROM mock_woo_products;
    DELETE FROM settings;
  `);

  // 1. Settings
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_active_driver', 'mock');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('mock_woo_simulate_failure', 'false');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_store_url', 'https://demo-woocommerce.local');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_consumer_key', 'ck_demo_f48a192837bcde');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_consumer_secret', 'cs_demo_992147aabb8812');

  // 2. Categories
  const catStmt = db.prepare('INSERT INTO categories (id, name, slug, description, woo_id) VALUES (?, ?, ?, ?, ?)');
  catStmt.run(1, 'Electronics', 'electronics', 'Audio, wearable technology, and electronic gear', 11);
  catStmt.run(2, 'Computer Peripherals', 'computer-peripherals', 'Mechanical keyboards, mice, and studio hubs', 12);
  catStmt.run(3, 'Kitchen', 'kitchen', 'Brew kits, pour-over gear, and kitchen essentials', 13);
  catStmt.run(4, 'Home & Living', 'home-living', 'Ambient lighting and modern home aesthetics', 14);
  catStmt.run(5, 'Grocery', 'grocery', 'Artisanal roasts, specialty coffee, and fine goods', 15);
  catStmt.run(6, 'Fashion & Accessories', 'fashion-accessories', 'Handcrafted leather goods and personal accessories', 16);
  catStmt.run(7, 'Furniture & Office', 'furniture-office', 'Ergonomic chairs and workspace ergonomics', 17);
  catStmt.run(8, 'Fitness & Outdoors', 'fitness-outdoors', 'Hydration and outdoor equipment', 18);

  // 3. Attributes & Options
  const attrStmt = db.prepare('INSERT INTO attributes (id, name, slug, type, is_variation, woo_id) VALUES (?, ?, ?, ?, ?, ?)');
  attrStmt.run(1, 'Color', 'color', 'select', 1, 21);
  attrStmt.run(2, 'Connectivity', 'connectivity', 'select', 0, 22);
  attrStmt.run(3, 'Material', 'material', 'select', 0, 23);
  attrStmt.run(4, 'Size', 'size', 'select', 1, 24);
  attrStmt.run(5, 'Brand', 'brand', 'select', 0, 25);

  const optStmt = db.prepare('INSERT INTO attribute_options (attribute_id, value, label) VALUES (?, ?, ?)');
  // Color options
  optStmt.run(1, 'Matte Black', 'Matte Black');
  optStmt.run(1, 'Glacier Silver', 'Glacier Silver');
  optStmt.run(1, 'Midnight Navy', 'Midnight Navy');
  // Connectivity options
  optStmt.run(2, 'Bluetooth 5.3', 'Bluetooth 5.3');
  optStmt.run(2, 'USB-C Wired', 'USB-C Wired');
  optStmt.run(2, '2.4GHz Wireless', '2.4GHz Wireless');
  // Material options
  optStmt.run(3, 'Titanium Alloy', 'Titanium Alloy');
  optStmt.run(3, 'Stainless Steel 316L', 'Stainless Steel 316L');
  optStmt.run(3, 'Breathable Mesh', 'Breathable Mesh');
  // Size options
  optStmt.run(4, 'Compact', 'Compact');
  optStmt.run(4, 'Standard', 'Standard');
  optStmt.run(4, '500g', '500g');

  // Insert product helpers
  const prodStmt = db.prepare(`
    INSERT INTO products (
      id, name, slug, sku, type, status, regular_price, sale_price,
      stock_quantity, manage_stock, description, short_description,
      image_url, brand, woo_id, sync_status, quality_score, quality_issues, last_synced_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `);
  const prodCatStmt = db.prepare('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)');
  const prodAttrStmt = db.prepare('INSERT INTO product_attributes (product_id, attribute_id, selected_values) VALUES (?, ?, ?)');

  const mockWooStmt = db.prepare(`
    INSERT INTO mock_woo_products (
      woo_id, name, slug, sku, type, status, regular_price, sale_price,
      stock_quantity, description, short_description, image_url, brand,
      categories_json, attributes_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `);

  // Product 1: Apex Pro Wireless Headphones
  prodStmt.run(
    1, 'Apex Pro Wireless Headphones', 'apex-pro-wireless-headphones', 'AERO-01', 'simple', 'draft',
    7499, null, 15, 1,
    'Active noise cancelling headphones with deep bass response.',
    'Studio headphones featuring 40mm drivers.',
    '/assets/products/headphones.jpg', 'Sony', null, 'not_synced', 57,
    JSON.stringify([
      { rule: 'description_length', field: 'description', severity: 'high', message: 'Missing rich product description with specifications' },
      { rule: 'attribute_completeness', field: 'attributes', severity: 'medium', message: 'Missing key attributes (Color, Connectivity)' },
      { rule: 'category_validation', field: 'categories', severity: 'medium', message: 'Category hierarchy is incomplete for WooCommerce electronics' },
      { rule: 'price_validation', field: 'sale_price', severity: 'low', message: 'No promotional sale price defined' },
      { rule: 'image_resolution', field: 'images', severity: 'medium', message: 'Only 1 product image present, recommend 3+' }
    ]),
    null
  );
  prodCatStmt.run(1, 1);
  prodAttrStmt.run(1, 1, JSON.stringify(['Matte Black']));

  // Product 2: AeroPulse Wireless Headphones (Conflict demo)
  prodStmt.run(
    2, 'AeroPulse Wireless Headphones', 'aeropulse-wireless-headphones', 'AERO-02', 'simple', 'draft',
    6999, 6499, 24, 1,
    '<p>Lightweight over-ear wireless headphones with quick acoustic tuning and dynamic transparency mode.</p>',
    'Comfortable everyday wireless headset with 30-hour playback.',
    '/assets/products/headphones.jpg', 'Sony', 101, 'modified', 55,
    JSON.stringify([
      { rule: 'conflict_detected', field: 'price', severity: 'high', message: 'PIM price ₹6,999 differs from WooCommerce price ₹7,999' },
      { rule: 'stock_conflict', field: 'stock_quantity', severity: 'high', message: 'PIM stock 24 differs from WooCommerce stock 20' }
    ]),
    new Date(Date.now() - 3600000).toISOString()
  );
  prodCatStmt.run(2, 1);
  mockWooStmt.run(
    101, 'Apex Pro Wireless Headphones', 'aero-01-woo', 'AERO-02', 'simple', 'publish',
    7999, null, 20, // Remote values divergent!
    '<p>Legacy WooCommerce product description.</p>', 'Legacy short desc',
    '/assets/products/headphones.jpg', 'Sony',
    JSON.stringify([{ id: 11, name: 'Footwear', slug: 'footwear' }]), // Deliberate category mismatch demo
    JSON.stringify([])
  );

  // Product 3: KeyCraft RGB Hot-Swappable Mechanical Keyboard
  prodStmt.run(
    3, 'KeyCraft RGB Hot-Swappable Mechanical Keyboard', 'keycraft-rgb-mechanical-keyboard', 'KEY-02', 'simple', 'draft',
    5566, 4999, 10, 1,
    '<p>75% compact mechanical keyboard with gasket mount design and pre-lubed mechanical switches.</p>',
    'Hot-swappable RGB keyboard with aluminum volume knob.',
    '/assets/products/keyboard.jpg', 'KeyCraft', 102, 'modified', 55,
    JSON.stringify([
      { rule: 'stock_depleted', field: 'stock', severity: 'medium', message: 'Remote WooCommerce stock is currently 0 (Out of stock)' }
    ]),
    new Date(Date.now() - 7200000).toISOString()
  );
  prodCatStmt.run(3, 2);
  prodAttrStmt.run(3, 2, JSON.stringify(['USB-C Wired']));
  mockWooStmt.run(
    102, 'KeyCraft RGB Hot-Swappable Mechanical Keyboard', 'keycraft-rgb-kb', 'KEY-02', 'simple', 'publish',
    3499, 2999, 0, // Out of stock in mock store
    'Mechanical keyboard', 'KeyCraft RGB', '/assets/products/keyboard.jpg', 'KeyCraft',
    JSON.stringify([{ id: 12, name: 'Computer Peripherals', slug: 'computer-peripherals' }]),
    JSON.stringify([{ name: 'Connectivity', options: ['USB-C Wired'] }])
  );

  // Product 4: AeroPress Travel Brew Kit
  prodStmt.run(
    4, 'AeroPress Travel Brew Kit', 'aeropress-travel-brew-kit', 'COF-AERO-099', 'simple', 'draft',
    3499, 2999, 15, 1,
    '<p>All-in-one travel coffee press featuring silicone sealing ring, micro-filters, and compact mug casing.</p>',
    'Ultra-portable coffee press for smooth, grit-free espresso-style coffee.',
    '/assets/products/brewer.jpg', 'AeroCraft', null, 'not_synced', 87,
    JSON.stringify([
      { rule: 'attribute_options', field: 'attributes', severity: 'low', message: 'Capacity specification not linked' }
    ]),
    null
  );
  prodCatStmt.run(4, 3);
  prodAttrStmt.run(4, 3, JSON.stringify(['Titanium Alloy']));

  // Product 5: Ambient LED Light Bar
  prodStmt.run(
    5, 'Ambient LED Light Bar', 'ambient-led-light-bar', 'LIGHT-007', 'simple', 'draft',
    2499, 1999, 60, 1,
    '<p>Sound-reactive RGB ambient light bar with desktop mounts and dual spectrum color blending.</p>',
    'Dynamic ambient light bar with wireless sync.',
    '/assets/products/led-bar.jpg', 'LuminaTech', null, 'not_synced', 62,
    JSON.stringify([
      { rule: 'category_path', field: 'categories', severity: 'medium', message: 'Category sub-taxonomies should be mapped' }
    ]),
    null
  );
  prodCatStmt.run(5, 4);

  // Product 6: Ethiopian Dark Roast Coffee
  prodStmt.run(
    6, 'Ethiopian Dark Roast Coffee', 'ethiopian-dark-roast-coffee', 'FOOD-COF-006', 'simple', 'publish',
    899, 799, 110, 1,
    '<p>Hand-harvested Yirgacheffe single-origin dark roast with notes of wild berries and rich dark chocolate.</p>',
    '500g whole bean specialty roasted Ethiopian Arabica coffee.',
    '/assets/products/coffee.jpg', 'OriginRoasts', 103, 'synced', 92,
    JSON.stringify([]),
    new Date(Date.now() - 14400000).toISOString()
  );
  prodCatStmt.run(6, 5);
  prodAttrStmt.run(6, 4, JSON.stringify(['500g']));
  mockWooStmt.run(
    103, 'Ethiopian Dark Roast Coffee', 'ethiopian-dark-roast', 'FOOD-COF-006', 'simple', 'publish',
    899, 799, 110,
    '500g whole bean specialty roast.', 'Ethiopian Arabica Coffee 500g',
    '/assets/products/coffee.jpg', 'OriginRoasts',
    JSON.stringify([{ id: 15, name: 'Grocery', slug: 'grocery' }]),
    JSON.stringify([{ name: 'Size', options: ['500g'] }])
  );

  // Product 7: Leather Crossbody Bag
  prodStmt.run(
    7, 'Leather Crossbody Bag', 'leather-crossbody-bag', 'BAG-LTH-01', 'simple', 'publish',
    5099, 4599, 18, 1,
    '<p>Full-grain vegetable-tanned leather messenger bag with solid antique brass hardware and adjustable strap.</p>',
    'Artisanal handcrafted leather crossbody bag.',
    '/assets/products/leather-bag.jpg', 'Heritage', 104, 'synced', 88,
    JSON.stringify([]),
    new Date(Date.now() - 28800000).toISOString()
  );
  prodCatStmt.run(7, 6);
  prodAttrStmt.run(7, 3, JSON.stringify(['Breathable Mesh']));
  mockWooStmt.run(
    104, 'Leather Crossbody Bag', 'leather-crossbody-bag', 'BAG-LTH-01', 'simple', 'publish',
    5099, 4599, 18,
    'Full-grain leather bag', 'Handcrafted leather crossbody bag',
    '/assets/products/leather-bag.jpg', 'Heritage',
    JSON.stringify([{ id: 16, name: 'Fashion & Accessories', slug: 'fashion-accessories' }]),
    JSON.stringify([])
  );

  // Product 8: Smart Watch Series 5
  prodStmt.run(
    8, 'Smart Watch Series 5', 'smart-watch-series-5', 'WATCH-S5', 'simple', 'publish',
    14999, 12999, 8, 1,
    '<p>Titanium case with always-on retina display, precision fitness tracking, ECG sensor, and water resistance to 50m.</p>',
    'Flagship smartwatch with multi-day battery and biometric sensors.',
    '/assets/products/smartwatch.jpg', 'ChronoTech', 105, 'synced', 78,
    JSON.stringify([]),
    new Date(Date.now() - 43200000).toISOString()
  );
  prodCatStmt.run(8, 1);
  prodAttrStmt.run(8, 1, JSON.stringify(['Matte Black']));
  mockWooStmt.run(
    105, 'Smart Watch Series 5', 'smart-watch-series-5', 'WATCH-S5', 'simple', 'publish',
    14999, 12999, 8,
    'Flagship smartwatch', 'Smart Watch Series 5',
    '/assets/products/smartwatch.jpg', 'ChronoTech',
    JSON.stringify([{ id: 11, name: 'Electronics', slug: 'electronics' }]),
    JSON.stringify([{ name: 'Color', options: ['Matte Black'] }])
  );

  // Product 9: Ergonomic Mesh Office Chair
  prodStmt.run(
    9, 'Ergonomic Mesh Office Chair', 'ergonomic-mesh-office-chair', 'FURN-CH-002', 'simple', 'draft',
    7499, null, 12, 1,
    null, null, null, 'ErgoPro', null, 'not_synced', 45,
    JSON.stringify([
      { rule: 'missing_description', field: 'description', severity: 'high', message: 'No product description found' },
      { rule: 'missing_image', field: 'image_url', severity: 'high', message: 'No product photography uploaded' }
    ]),
    null
  );
  prodCatStmt.run(9, 7);

  // Product 10: HydraCore Thermal Insulated Water Bottle 750ml
  prodStmt.run(
    10, 'HydraCore Thermal Insulated Water Bottle 750ml', 'hydracore-water-bottle-750ml', 'FIT-HYD-004', 'simple', 'publish',
    1499, 1299, 80, 1,
    '<p>Double-wall vacuum insulated stainless steel water bottle. Keeps drinks cold for 24 hours.</p>',
    'Sports insulated bottle 750ml.',
    null, 'HydraCore', 106, 'synced', 70,
    JSON.stringify([]),
    new Date(Date.now() - 86400000).toISOString()
  );
  prodCatStmt.run(10, 8);
  mockWooStmt.run(
    106, 'HydraCore Thermal Insulated Water Bottle 750ml', 'hydracore-bottle', 'FIT-HYD-004', 'simple', 'publish',
    1499, 1299, 80,
    'Vacuum insulated bottle', 'Sports bottle',
    null, 'HydraCore',
    JSON.stringify([{ id: 18, name: 'Fitness & Outdoors', slug: 'fitness-outdoors' }]),
    JSON.stringify([])
  );

  // 4. Meaningful Audit Trail Logs
  const logStmt = db.prepare(`
    INSERT INTO sync_logs (
      product_id, product_name, entity_type, direction, action,
      status, changed_fields, request_payload, response_payload, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  logStmt.run(
    1, 'Apex Pro Wireless Headphones', 'product', 'pim_to_woo', 'update',
    'success', JSON.stringify(['regular_price', 'stock_quantity']),
    JSON.stringify({ sku: 'AERO-01', regular_price: 7499, stock_quantity: 15 }),
    JSON.stringify({ id: 101, status: 'updated' }),
    null,
    new Date(Date.now() - 2 * 60000).toISOString()
  );

  logStmt.run(
    7, 'Leather Crossbody Bag', 'product', 'pim_to_woo', 'ai_analysis',
    'success', JSON.stringify(['ai_review', 'quality_score']),
    JSON.stringify({ sku: 'BAG-LTH-01', action: 'ai_enrichment' }),
    JSON.stringify({ quality_score: 88, issues: 0 }),
    null,
    new Date(Date.now() - 12 * 60000).toISOString()
  );

  logStmt.run(
    8, 'Smart Watch Series 5', 'product', 'woo_to_pim', 'import',
    'failed', JSON.stringify(['categories', 'attributes']),
    JSON.stringify({ woo_id: 105 }),
    JSON.stringify({ error: 'Schema validation error: Missing attribute mapping' }),
    'Attribute mapping mismatch for Color variation on remote payload',
    new Date(Date.now() - 28 * 60000).toISOString()
  );

  logStmt.run(
    6, 'Ethiopian Dark Roast Coffee', 'product', 'pim_to_woo', 'create',
    'success', JSON.stringify(['name', 'sku', 'price', 'stock']),
    JSON.stringify({ sku: 'FOOD-COF-006', stock: 110 }),
    JSON.stringify({ id: 103, status: 'publish' }),
    null,
    new Date(Date.now() - 3600000).toISOString()
  );

  logStmt.run(
    5, 'Ambient LED Light Bar', 'product', 'pim_to_woo', 'update',
    'success', JSON.stringify(['stock_quantity']),
    JSON.stringify({ sku: 'LIGHT-007', stock_quantity: 60 }),
    JSON.stringify({ id: 104, status: 'updated' }),
    null,
    new Date(Date.now() - 3 * 3600000).toISOString()
  );

  logStmt.run(
    3, 'KeyCraft RGB Hot-Swappable Mechanical Keyboard', 'product', 'woo_to_pim', 'import',
    'success', JSON.stringify(['regular_price', 'stock_quantity']),
    JSON.stringify({ sku: 'KEY-02' }),
    JSON.stringify({ id: 102, status: 'imported' }),
    null,
    new Date(Date.now() - 4 * 3600000).toISOString()
  );

  console.log('✅ Successfully seeded 10 realistic products matching the reference mockups!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
  process.exit(0);
}
