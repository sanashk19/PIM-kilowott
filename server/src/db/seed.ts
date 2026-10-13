import { getDb } from './connection.js';
import { initializeSchema } from './schema.js';
import { QualityScoreService } from '../services/qualityScoreService.js';

export function runSeed(): void {
  initializeSchema();
  const db = getDb();

  console.log('🌱 Seeding VERIDEX enterprise catalog database...');

  // Clear existing data cleanly
  db.exec(`
    DELETE FROM product_categories;
    DELETE FROM product_attributes;
    DELETE FROM attribute_options;
    DELETE FROM sync_logs;
    DELETE FROM sync_changesets;
    DELETE FROM ai_agent_runs;
    DELETE FROM products;
    DELETE FROM categories;
    DELETE FROM attributes;
    DELETE FROM mock_woo_products;
    DELETE FROM settings;
  `);

  // 1. Settings & Source-of-Truth Policies
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_active_driver', 'mock');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('mock_woo_simulate_failure', 'false');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_store_url', 'https://demo-woocommerce.local');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_consumer_key', 'ck_demo_f48a192837bcde');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('woo_consumer_secret', 'cs_demo_992147aabb8812');
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run(
    'source_of_truth_policies',
    JSON.stringify({
      name: 'PIM',
      sku: 'PIM',
      regular_price: 'PIM',
      sale_price: 'PIM',
      stock_quantity: 'WOOCOMMERCE',
      description: 'PIM',
      short_description: 'PIM',
      categories: 'PIM',
      attributes: 'PIM',
      image_url: 'PIM',
      brand: 'PIM',
    })
  );

  // 2. Categories (Exact real-world taxonomy, zero default leakage)
  const catStmt = db.prepare('INSERT INTO categories (id, name, slug, description, woo_id) VALUES (?, ?, ?, ?, ?)');
  catStmt.run(1, 'Electronics', 'electronics', 'Audio, wearable technology, and high-fidelity sound gear', 11);
  catStmt.run(2, 'Computer Peripherals', 'computer-peripherals', 'Mechanical keyboards, docking stations, and studio hubs', 12);
  catStmt.run(3, 'Kitchen', 'kitchen', 'Brew kits, pour-over gear, and specialty coffee equipment', 13);
  catStmt.run(4, 'Home & Living', 'home-living', 'Ambient lighting and modern home aesthetics', 14);
  catStmt.run(5, 'Grocery', 'grocery', 'Artisanal roasts, single-origin beans, and gourmet pantry goods', 15);
  catStmt.run(6, 'Fashion & Accessories', 'fashion-accessories', 'Handcrafted leather goods and personal carry items', 16);
  catStmt.run(7, 'Furniture & Office', 'furniture-office', 'Ergonomic chairs and modern workspace furnishings', 17);
  catStmt.run(8, 'Fitness & Outdoors', 'fitness-outdoors', 'Hydration bottles and outdoor expedition gear', 18);

  // 3. Technical Attributes & Options (Clean capacity mapping, no 750ml under Size)
  const attrStmt = db.prepare('INSERT INTO attributes (id, name, slug, type, is_variation, woo_id) VALUES (?, ?, ?, ?, ?, ?)');
  attrStmt.run(1, 'Color', 'color', 'select', 1, 21);
  attrStmt.run(2, 'Connectivity', 'connectivity', 'select', 0, 22);
  attrStmt.run(3, 'Material', 'material', 'select', 0, 23);
  attrStmt.run(4, 'Size', 'size', 'select', 1, 24);
  attrStmt.run(5, 'Brand', 'brand', 'select', 0, 25);
  attrStmt.run(6, 'Capacity', 'capacity', 'select', 0, 26);

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
  optStmt.run(3, 'Full-Grain Leather', 'Full-Grain Leather');
  // Size options
  optStmt.run(4, 'Compact', 'Compact');
  optStmt.run(4, 'Standard', 'Standard');
  optStmt.run(4, '500g', '500g');
  // Capacity options
  optStmt.run(6, '750ml', '750ml');
  optStmt.run(6, '1L', '1L');
  optStmt.run(6, '500ml', '500ml');

  // Insert helpers
  const prodStmt = db.prepare(`
    INSERT INTO products (
      id, name, slug, sku, type, status, regular_price, sale_price,
      stock_quantity, manage_stock, description, short_description,
      image_url, brand, woo_id, sync_status, quality_score, quality_issues,
      baseline_snapshot, last_synced_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?
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

  // ==========================================
  // SCENARIO 1: PIM_CHANGED (PIM changed price only)
  // Baseline price: ₹7,499 | PIM price: ₹8,999 | Woo price: ₹7,499
  // ==========================================
  prodStmt.run(
    1, 'Apex Pro Wireless Headphones', 'apex-pro-wireless-headphones', 'AUDIO-APX-001', 'simple', 'publish',
    8999, null, 15, 1,
    '<p>Engineered with custom 40mm titanium drivers and hybrid active noise cancellation, the Apex Pro delivers reference-grade acoustics with 45-hour wireless battery life.</p>',
    'Active noise cancelling headphones with 45-hour battery life.',
    '/assets/products/headphones.jpg', 'ApexAudio', 101, 'modified', 92,
    null,
    JSON.stringify({
      name: 'Apex Pro Wireless Headphones',
      sku: 'AUDIO-APX-001',
      regular_price: 7499,
      sale_price: null,
      stock_quantity: 15,
      description: '<p>Engineered with custom 40mm titanium drivers and hybrid active noise cancellation, the Apex Pro delivers reference-grade acoustics with 45-hour wireless battery life.</p>',
      categories: ['Electronics'],
      brand: 'ApexAudio',
    }),
    new Date(Date.now() - 3600000).toISOString()
  );
  prodCatStmt.run(1, 1);
  prodAttrStmt.run(1, 1, JSON.stringify(['Matte Black']));
  prodAttrStmt.run(1, 2, JSON.stringify(['Bluetooth 5.3']));

  mockWooStmt.run(
    101, 'Apex Pro Wireless Headphones', 'apex-pro-wireless-headphones', 'AUDIO-APX-001', 'simple', 'publish',
    7499, null, 15, // Woo has baseline price
    '<p>Engineered with custom 40mm titanium drivers and hybrid active noise cancellation, the Apex Pro delivers reference-grade acoustics with 45-hour wireless battery life.</p>',
    'Active noise cancelling headphones with 45-hour battery life.',
    '/assets/products/headphones.jpg', 'ApexAudio',
    JSON.stringify([{ id: 11, name: 'Electronics', slug: 'electronics' }]),
    JSON.stringify([{ name: 'Color', options: ['Matte Black'] }])
  );

  // ==========================================
  // SCENARIO 2: WOO_CHANGED (Woo changed stock only)
  // Baseline stock: 25 | PIM stock: 25 | Woo stock: 12
  // ==========================================
  prodStmt.run(
    2, 'KeyCraft Mechanical Keyboard', 'keycraft-mechanical-keyboard', 'KEY-02', 'simple', 'publish',
    4999, 4499, 25, 1,
    '<p>Gasket-mounted 75% mechanical keyboard featuring hot-swappable tactile switches, per-key RGB backlighting, and CNC aluminum volume dial.</p>',
    'Compact 75% hot-swappable tactile keyboard with volume dial.',
    '/assets/products/keyboard.jpg', 'KeyCraft', 102, 'modified', 95,
    null,
    JSON.stringify({
      name: 'KeyCraft Mechanical Keyboard',
      sku: 'KEY-02',
      regular_price: 4999,
      sale_price: 4499,
      stock_quantity: 25,
      description: '<p>Gasket-mounted 75% mechanical keyboard featuring hot-swappable tactile switches, per-key RGB backlighting, and CNC aluminum volume dial.</p>',
      categories: ['Computer Peripherals'],
      brand: 'KeyCraft',
    }),
    new Date(Date.now() - 7200000).toISOString()
  );
  prodCatStmt.run(2, 2);
  prodAttrStmt.run(2, 2, JSON.stringify(['USB-C Wired']));

  mockWooStmt.run(
    102, 'KeyCraft Mechanical Keyboard', 'keycraft-mechanical-keyboard', 'KEY-02', 'simple', 'publish',
    4999, 4499, 12, // Remote stock sold down from 25 to 12
    '<p>Gasket-mounted 75% mechanical keyboard featuring hot-swappable tactile switches, per-key RGB backlighting, and CNC aluminum volume dial.</p>',
    'Compact 75% hot-swappable tactile keyboard with volume dial.',
    '/assets/products/keyboard.jpg', 'KeyCraft',
    JSON.stringify([{ id: 12, name: 'Computer Peripherals', slug: 'computer-peripherals' }]),
    JSON.stringify([{ name: 'Connectivity', options: ['USB-C Wired'] }])
  );

  // ==========================================
  // SCENARIO 3: CONFLICT (Both changed description differently)
  // Baseline: A | PIM: B | Woo: C
  // ==========================================
  const baseBagDesc = 'Classic handcrafted full-grain leather crossbody messenger bag with solid brass hardware.';
  const pimBagDesc = 'Modernized genuine leather crossbody bag featuring quick-release magnetic snap closures.';
  const wooBagDesc = 'Vintage handcrafted artisan leather shoulder bag with antique brass patina.';

  prodStmt.run(
    3, 'Leather Crossbody Bag', 'leather-crossbody-bag', 'BAG-LTH-01', 'simple', 'publish',
    5099, 4599, 18, 1,
    pimBagDesc,
    'Artisanal handcrafted leather crossbody bag.',
    '/assets/products/leather-bag.jpg', 'Heritage', 103, 'modified', 88,
    null,
    JSON.stringify({
      name: 'Leather Crossbody Bag',
      sku: 'BAG-LTH-01',
      regular_price: 5099,
      sale_price: 4599,
      stock_quantity: 18,
      description: baseBagDesc,
      categories: ['Fashion & Accessories'],
      brand: 'Heritage',
    }),
    new Date(Date.now() - 28800000).toISOString()
  );
  prodCatStmt.run(3, 6);
  prodAttrStmt.run(3, 3, JSON.stringify(['Full-Grain Leather']));

  mockWooStmt.run(
    103, 'Leather Crossbody Bag', 'leather-crossbody-bag', 'BAG-LTH-01', 'simple', 'publish',
    5099, 4599, 18,
    wooBagDesc,
    'Artisanal handcrafted leather crossbody bag.',
    '/assets/products/leather-bag.jpg', 'Heritage',
    JSON.stringify([{ id: 16, name: 'Fashion & Accessories', slug: 'fashion-accessories' }]),
    JSON.stringify([{ name: 'Material', options: ['Full-Grain Leather'] }])
  );

  // ==========================================
  // SCENARIO 4: Quality Warning (Missing Image)
  // image_url is null -> triggers explainable quality deduction (-10)
  // ==========================================
  prodStmt.run(
    4, 'OriginRoasts Ethiopian Dark Roast', 'originroasts-ethiopian-dark-roast', 'FOOD-COF-006', 'simple', 'draft',
    899, 799, 110, 1,
    '<p>Hand-harvested Yirgacheffe single-origin dark roast with tasting notes of wild blueberries, roasted hazelnuts, and dark cocoa.</p>',
    '500g whole bean specialty roasted Ethiopian Arabica coffee.',
    null, // Missing image!
    'OriginRoasts', null, 'not_synced', 75,
    JSON.stringify([
      { field: 'image_url', severity: 'medium', message: 'Missing primary product image', recommendation: 'Attach a high-resolution primary product image URL.' }
    ]),
    null,
    null
  );
  prodCatStmt.run(4, 5);
  prodAttrStmt.run(4, 4, JSON.stringify(['500g']));

  // ==========================================
  // SCENARIO 5: Guardrail Blocked (Large price change >30%)
  // Regular price: ₹2,499. Triggers PRICE_CHANGE_TOO_LARGE when modified or proposed high
  // ==========================================
  prodStmt.run(
    5, 'Ambient Rhythm LED Light Bar', 'ambient-rhythm-led-light-bar', 'LIGHT-AMB-01', 'simple', 'draft',
    2499, 1999, 60, 1,
    '<p>Sound-reactive RGB ambient light bar with desktop mounts, dynamic spectrum blending, and zero-latency mic pickup.</p>',
    'Dynamic ambient light bar with sound synchronization.',
    '/assets/products/led-bar.jpg', 'LuminaTech', null, 'not_synced', 82,
    null,
    null,
    null
  );
  prodCatStmt.run(5, 4);
  prodAttrStmt.run(5, 1, JSON.stringify(['Matte Black']));

  // ==========================================
  // SCENARIO 6: MATCH (Everything in sync)
  // Baseline == PIM == Woo
  // ==========================================
  const aeroDesc = '<p>Ultra-compact travel coffee press featuring silicone sealing ring, stainless micro-filters, and durable travel mug casing.</p>';
  prodStmt.run(
    6, 'AeroPress Travel Brew Kit', 'aeropress-travel-brew-kit', 'COF-AERO-01', 'simple', 'publish',
    3499, null, 18, 1,
    aeroDesc,
    'Ultra-portable coffee press for smooth, grit-free espresso-style brew.',
    '/assets/products/brewer.jpg', 'AeroCraft', 106, 'synced', 95,
    null,
    JSON.stringify({
      name: 'AeroPress Travel Brew Kit',
      sku: 'COF-AERO-01',
      regular_price: 3499,
      sale_price: null,
      stock_quantity: 18,
      description: aeroDesc,
      categories: ['Kitchen'],
      brand: 'AeroCraft',
    }),
    new Date(Date.now() - 14400000).toISOString()
  );
  prodCatStmt.run(6, 3);
  prodAttrStmt.run(6, 3, JSON.stringify(['Titanium Alloy']));

  mockWooStmt.run(
    106, 'AeroPress Travel Brew Kit', 'aeropress-travel-brew-kit', 'COF-AERO-01', 'simple', 'publish',
    3499, null, 18,
    aeroDesc,
    'Ultra-portable coffee press for smooth, grit-free espresso-style brew.',
    '/assets/products/brewer.jpg', 'AeroCraft',
    JSON.stringify([{ id: 13, name: 'Kitchen', slug: 'kitchen' }]),
    JSON.stringify([{ name: 'Material', options: ['Titanium Alloy'] }])
  );

  // ==========================================
  // Additional realistic catalog products (7 - 10)
  // ==========================================
  // Product 7: Smart Watch Series 5
  prodStmt.run(
    7, 'Smart Watch Series 5', 'smart-watch-series-5', 'WATCH-S5', 'simple', 'publish',
    14999, 12999, 8, 1,
    '<p>Titanium case with always-on retina display, precision heart rate monitoring, ECG sensor, and water resistance to 50m.</p>',
    'Flagship smartwatch with biometric sensors.',
    '/assets/products/smartwatch.jpg', 'ChronoTech', 107, 'synced', 94,
    null,
    JSON.stringify({
      name: 'Smart Watch Series 5',
      sku: 'WATCH-S5',
      regular_price: 14999,
      sale_price: 12999,
      stock_quantity: 8,
      description: '<p>Titanium case with always-on retina display, precision heart rate monitoring, ECG sensor, and water resistance to 50m.</p>',
      categories: ['Electronics'],
      brand: 'ChronoTech',
    }),
    new Date(Date.now() - 43200000).toISOString()
  );
  prodCatStmt.run(7, 1);
  prodAttrStmt.run(7, 1, JSON.stringify(['Glacier Silver']));
  mockWooStmt.run(
    107, 'Smart Watch Series 5', 'smart-watch-series-5', 'WATCH-S5', 'simple', 'publish',
    14999, 12999, 8,
    '<p>Titanium case with always-on retina display, precision heart rate monitoring, ECG sensor, and water resistance to 50m.</p>',
    'Flagship smartwatch with biometric sensors.',
    '/assets/products/smartwatch.jpg', 'ChronoTech',
    JSON.stringify([{ id: 11, name: 'Electronics', slug: 'electronics' }]),
    JSON.stringify([{ name: 'Color', options: ['Glacier Silver'] }])
  );

  // Product 8: Ergonomic Office Chair
  prodStmt.run(
    8, 'Ergonomic Office Chair', 'ergonomic-office-chair', 'FURN-CH-002', 'simple', 'publish',
    14999, 13499, 14, 1,
    '<p>Breathable mesh task chair with adaptive lumbar spine support, 4D adjustable armrests, and synchro-tilt recline mechanism.</p>',
    'Ergonomic mesh task chair with lumbar contour support.',
    '/assets/products/office-chair.jpg', 'ErgoPro', null, 'not_synced', 90,
    null,
    null,
    null
  );
  prodCatStmt.run(8, 7);
  prodAttrStmt.run(8, 3, JSON.stringify(['Breathable Mesh']));

  // Product 9: Portable USB-C Hub
  prodStmt.run(
    9, 'Portable USB-C Hub 7-in-1', 'portable-usbc-hub-7in1', 'HUB-USBC-01', 'simple', 'publish',
    1999, 1699, 35, 1,
    '<p>7-in-1 aluminum multiport adapter featuring 4K 60Hz HDMI output, 100W Power Delivery pass-through, and SD/TF card readers.</p>',
    'Multiport USB-C adapter with 4K HDMI and 100W PD charging.',
    '/assets/products/usb-hub.jpg', 'AnkerTech', null, 'not_synced', 91,
    null,
    null,
    null
  );
  prodCatStmt.run(9, 2);
  prodAttrStmt.run(9, 2, JSON.stringify(['USB-C Wired']));

  // Product 10: HydraCore Insulated Water Bottle 750ml (Capacity, NOT Size)
  prodStmt.run(
    10, 'HydraCore Insulated Water Bottle', 'hydracore-insulated-water-bottle', 'FIT-HYD-004', 'simple', 'publish',
    1499, 1299, 50, 1,
    '<p>Double-wall vacuum insulated stainless steel canteen keeping cold drinks chilled for 24 hours and hot coffee steaming for 12 hours.</p>',
    'Vacuum insulated steel bottle with leakproof lid.',
    '/assets/products/water-bottle.jpg', 'HydraCore', null, 'not_synced', 92,
    null,
    null,
    null
  );
  prodCatStmt.run(10, 8);
  prodAttrStmt.run(10, 3, JSON.stringify(['Stainless Steel 316L']));
  prodAttrStmt.run(10, 6, JSON.stringify(['750ml'])); // Under Capacity attribute!

  // Recalculate and store realistic explainable quality scores for all seeded products
  const allProds = db.prepare('SELECT id, name, sku, regular_price, sale_price, stock_quantity, description, short_description, image_url, brand FROM products').all() as any[];
  for (const p of allProds) {
    const cats = db.prepare('SELECT c.name FROM categories c INNER JOIN product_categories pc ON c.id = pc.category_id WHERE pc.product_id = ?').all(p.id) as any[];
    const attrs = db.prepare('SELECT id FROM product_attributes WHERE product_id = ?').all(p.id);
    const assessment = QualityScoreService.assess({
      ...p,
      categories: cats,
      product_attributes: attrs,
    });
    db.prepare('UPDATE products SET quality_score = ?, quality_issues = ? WHERE id = ?').run(
      assessment.score,
      JSON.stringify(assessment.issues),
      p.id
    );
  }

  // 4. Initial Audit Ledger with Snapshot Data for Demonstrable Rollback
  const logStmt = db.prepare(`
    INSERT INTO sync_logs (
      product_id, product_name, entity_type, direction, action,
      status, changed_fields, request_payload, response_payload, previous_snapshot, changeset_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  logStmt.run(
    1, 'Apex Pro Wireless Headphones', 'product', 'pim_to_woo', 'update',
    'success', JSON.stringify(['regular_price']),
    JSON.stringify({ regular_price: 8999 }),
    JSON.stringify({ id: 101, status: 'synced' }),
    JSON.stringify({
      name: 'Apex Pro Wireless Headphones',
      sku: 'AUDIO-APX-001',
      regular_price: 7499,
      sale_price: null,
      stock_quantity: 15,
      description: 'Active noise cancelling headphones with deep bass response.',
      brand: 'ApexAudio',
    }),
    'cs_init_001',
    new Date(Date.now() - 10 * 60000).toISOString()
  );

  logStmt.run(
    2, 'KeyCraft Mechanical Keyboard', 'product', 'woo_to_pim', 'import',
    'success', JSON.stringify(['stock_quantity']),
    JSON.stringify({ stock_quantity: 12 }),
    JSON.stringify({ id: 102, status: 'updated' }),
    JSON.stringify({
      stock_quantity: 25,
      regular_price: 4999,
    }),
    'cs_init_002',
    new Date(Date.now() - 25 * 60000).toISOString()
  );

  logStmt.run(
    3, 'Leather Crossbody Bag', 'product', 'pim_to_woo', 'conflict_detected',
    'warning', JSON.stringify(['description']),
    JSON.stringify({ resolution_needed: true }),
    JSON.stringify({ conflict: 'Description divergent across PIM and WooCommerce' }),
    JSON.stringify({
      description: baseBagDesc,
    }),
    'cs_init_003',
    new Date(Date.now() - 45 * 60000).toISOString()
  );

  logStmt.run(
    6, 'AeroPress Travel Brew Kit', 'product', 'pim_to_woo', 'create',
    'success', JSON.stringify(['name', 'sku', 'regular_price', 'stock_quantity']),
    JSON.stringify({ sku: 'COF-AERO-01', regular_price: 3499 }),
    JSON.stringify({ id: 106, status: 'published' }),
    JSON.stringify({ regular_price: 3499, stock_quantity: 18 }),
    'cs_init_004',
    new Date(Date.now() - 3600000).toISOString()
  );

  console.log('✅ Successfully seeded VERIDEX enterprise catalog with 6 deliberate demo scenarios & realistic attributes!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
  process.exit(0);
}
