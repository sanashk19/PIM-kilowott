import { getDb } from './connection.js';
import { initializeSchema } from './schema.js';
import { QualityScoreService } from '../services/qualityScoreService.js';

export function runSeed(): void {
  initializeSchema();
  const db = getDb();

  console.log('🌱 Seeding PIM Sentinel database...');

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
  catStmt.run(1, 'Audio & Electronics', 'audio-electronics', 'Headphones, speakers, and premium audio equipment', 11);
  catStmt.run(2, 'Furniture & Office', 'furniture-office', 'Ergonomic chairs, desks, and workspace essentials', 12);
  catStmt.run(3, 'Footwear & Apparel', 'footwear-apparel', 'Performance shoes, activewear, and running gear', 13);
  catStmt.run(4, 'Fitness & Outdoors', 'fitness-outdoors', 'Hydration, gym gear, and outdoor survival accessories', 14);
  catStmt.run(5, 'Computer Peripherals', 'computer-peripherals', 'Mechanical keyboards, gaming mice, and studio hubs', 15);
  catStmt.run(6, 'Gourmet & Groceries', 'gourmet-groceries', 'Artisanal roasts, specialty snacks, and whole foods', 16);
  catStmt.run(7, 'Smart Home & Lighting', 'smart-home-lighting', 'Ambient lighting, smart bulbs, and automation hubs', 17);

  // 3. Attributes & Options
  const attrStmt = db.prepare('INSERT INTO attributes (id, name, slug, type, is_variation, woo_id) VALUES (?, ?, ?, ?, ?, ?)');
  attrStmt.run(1, 'Color', 'color', 'select', 1, 21);
  attrStmt.run(2, 'Size', 'size', 'select', 1, 22);
  attrStmt.run(3, 'Connectivity', 'connectivity', 'select', 0, 23);
  attrStmt.run(4, 'Material', 'material', 'select', 0, 24);

  const optStmt = db.prepare('INSERT INTO attribute_options (attribute_id, value, label) VALUES (?, ?, ?)');
  // Color options
  optStmt.run(1, 'Matte Black', 'Matte Black');
  optStmt.run(1, 'Glacier Silver', 'Glacier Silver');
  optStmt.run(1, 'Midnight Navy', 'Midnight Navy');
  // Size options
  optStmt.run(2, 'Medium', 'Medium');
  optStmt.run(2, 'Large', 'Large');
  optStmt.run(2, '750ml', '750ml');
  // Connectivity options
  optStmt.run(3, 'Bluetooth 5.3', 'Bluetooth 5.3');
  optStmt.run(3, 'USB-C Wired', 'USB-C Wired');
  optStmt.run(3, '2.4GHz Wireless', '2.4GHz Wireless');
  // Material options
  optStmt.run(4, 'Titanium Alloy', 'Titanium Alloy');
  optStmt.run(4, 'Stainless Steel 316L', 'Stainless Steel 316L');
  optStmt.run(4, 'Breathable Mesh', 'Breathable Mesh');

  // Helper to insert product
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

  // Helper for mock woo product
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

  // ========================================================
  // PRODUCT 1: EXCELLENT (Score ~95 - Benchmark control)
  // ========================================================
  const p1Raw = {
    id: 1,
    name: 'Apex Pro Wireless Active Noise-Cancelling Headphones',
    slug: 'apex-pro-wireless-anc-headphones',
    sku: 'AUDIO-APX-001',
    type: 'simple' as const,
    status: 'publish' as const,
    regular_price: 12999,
    sale_price: 9999,
    stock_quantity: 45,
    manage_stock: true,
    description: '<p>Engineered for discerning audiophiles and professionals, the <strong>Apex Pro</strong> features hybrid dual-driver acoustic architecture delivering pristine high-fidelity audio with ultra-deep bass response.</p><ul><li>45dB Adaptive Active Noise Cancellation</li><li>Up to 55-hour battery lifespan with Rapid Charge</li><li>Ultra-soft memory foam earcups for all-day listening comfort</li><li>Multipoint Bluetooth 5.3 pairing across laptop and mobile</li></ul>',
    short_description: 'Studio-grade wireless ANC headphones featuring 55-hour battery life and custom 40mm titanium drivers.',
    image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
    brand: 'ApexAudio',
    woo_id: 101,
    sync_status: 'synced' as const,
    categories: [{ id: 1, name: 'Audio & Electronics', slug: 'audio-electronics' }],
    product_attributes: [{ attribute_id: 1, selected_values: ['Matte Black', 'Glacier Silver'] }],
  };
  const p1Assessment = QualityScoreService.assess(p1Raw as any);
  prodStmt.run(
    p1Raw.id, p1Raw.name, p1Raw.slug, p1Raw.sku, p1Raw.type, p1Raw.status,
    p1Raw.regular_price, p1Raw.sale_price, p1Raw.stock_quantity, 1,
    p1Raw.description, p1Raw.short_description, p1Raw.image_url, p1Raw.brand,
    p1Raw.woo_id, p1Raw.sync_status, p1Assessment.score, JSON.stringify(p1Assessment.issues),
    new Date(Date.now() - 3600000).toISOString()
  );
  prodCatStmt.run(1, 1);
  prodAttrStmt.run(1, 1, JSON.stringify(['Matte Black', 'Glacier Silver']));
  prodAttrStmt.run(1, 3, JSON.stringify(['Bluetooth 5.3']));

  // Mirror in Mock Woo
  mockWooStmt.run(
    101, p1Raw.name, p1Raw.slug, p1Raw.sku, 'simple', 'publish',
    12999, 9999, 45, p1Raw.description, p1Raw.short_description,
    p1Raw.image_url, p1Raw.brand,
    JSON.stringify([{ id: 11, name: 'Audio & Electronics', slug: 'audio-electronics' }]),
    JSON.stringify([{ name: 'Color', options: ['Matte Black', 'Glacier Silver'] }])
  );

  // ========================================================
  // PRODUCT 2: MISSING INFORMATION (Score ~40 - Needs Attention)
  // Demo path: AI Agent generates description, fixes SEO, assigns category
  // ========================================================
  const p2Raw = {
    id: 2,
    name: 'Ergonomic Mesh Office Chair',
    slug: 'ergonomic-mesh-office-chair',
    sku: 'FURN-CH-002',
    type: 'simple' as const,
    status: 'publish' as const,
    regular_price: 7499,
    sale_price: null,
    stock_quantity: 12,
    manage_stock: true,
    description: null,          // Missing description!
    short_description: null,    // Missing short desc!
    image_url: null,            // Missing image!
    brand: null,                // Missing brand!
    woo_id: null,
    sync_status: 'not_synced' as const,
    categories: [],             // Missing category!
    product_attributes: [],     // Missing attributes!
  };
  const p2Assessment = QualityScoreService.assess(p2Raw as any);
  prodStmt.run(
    p2Raw.id, p2Raw.name, p2Raw.slug, p2Raw.sku, p2Raw.type, p2Raw.status,
    p2Raw.regular_price, null, p2Raw.stock_quantity, 1,
    null, null, null, null, null,
    p2Raw.sync_status, p2Assessment.score, JSON.stringify(p2Assessment.issues), null
  );

  // ========================================================
  // PRODUCT 3: PRICING PROBLEMS (Score ~45 - Critical Issue)
  // Sale price (6499) > Regular price (4999) - Fatal validation error!
  // ========================================================
  const p3Raw = {
    id: 3,
    name: 'Ultra-Light Titanium Trail Running Shoes',
    slug: 'ultra-light-titanium-trail-running-shoes',
    sku: 'FOOT-RUN-003',
    type: 'simple' as const,
    status: 'publish' as const,
    regular_price: 4999,
    sale_price: 6499,          // INVALID: sale > regular!
    stock_quantity: 20,
    manage_stock: true,
    description: '<p>Technical lightweight trail shoes designed for technical backcountry ascents and wet mountain terrain.</p>',
    short_description: 'High-traction all-terrain running shoe with reinforced titanium shank.',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    brand: 'Vanguard Athletics',
    woo_id: null,
    sync_status: 'not_synced' as const,
    categories: [{ id: 3, name: 'Footwear & Apparel', slug: 'footwear-apparel' }],
    product_attributes: [],
  };
  const p3Assessment = QualityScoreService.assess(p3Raw as any);
  prodStmt.run(
    p3Raw.id, p3Raw.name, p3Raw.slug, p3Raw.sku, p3Raw.type, p3Raw.status,
    p3Raw.regular_price, p3Raw.sale_price, p3Raw.stock_quantity, 1,
    p3Raw.description, p3Raw.short_description, p3Raw.image_url, p3Raw.brand,
    null, p3Raw.sync_status, p3Assessment.score, JSON.stringify(p3Assessment.issues), null
  );
  prodCatStmt.run(3, 3);

  // ========================================================
  // PRODUCT 4: ATTRIBUTE INCOMPLETENESS (Score ~65 - Needs Specs)
  // Missing specs/attributes for filtration
  // ========================================================
  const p4Raw = {
    id: 4,
    name: 'HydraCore Thermal Insulated Water Bottle 750ml',
    slug: 'hydracore-thermal-insulated-water-bottle-750ml',
    sku: 'FIT-HYD-004',
    type: 'simple' as const,
    status: 'publish' as const,
    regular_price: 1499,
    sale_price: 1299,
    stock_quantity: 80,
    manage_stock: true,
    description: '<p>Vacuum sealed sports bottle that keeps cold drinks ice-cold for 24 hours and hot coffee steaming for 12 hours.</p>',
    short_description: 'Double-walled stainless steel flask with leak-proof sport lid.',
    image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
    brand: 'HydraCore',
    woo_id: null,
    sync_status: 'not_synced' as const,
    categories: [{ id: 4, name: 'Fitness & Outdoors', slug: 'fitness-outdoors' }],
    product_attributes: [],    // Missing attributes
  };
  const p4Assessment = QualityScoreService.assess(p4Raw as any);
  prodStmt.run(
    p4Raw.id, p4Raw.name, p4Raw.slug, p4Raw.sku, p4Raw.type, p4Raw.status,
    p4Raw.regular_price, p4Raw.sale_price, p4Raw.stock_quantity, 1,
    p4Raw.description, p4Raw.short_description, p4Raw.image_url, p4Raw.brand,
    null, p4Raw.sync_status, p4Assessment.score, JSON.stringify(p4Assessment.issues), null
  );
  prodCatStmt.run(4, 4);

  // ========================================================
  // PRODUCT 5: CONFLICT DEMO (Score ~90)
  // PIM has Price = ₹4499 / Stock = 35
  // Mock WooCommerce has Price = ₹3499 / Stock = 15
  // Produces clear CONFLICT DETECTED in Pre-Flight Diff!
  // ========================================================
  const p5Raw = {
    id: 5,
    name: 'KeyCraft RGB Hot-Swappable Mechanical Keyboard',
    slug: 'keycraft-rgb-mechanical-keyboard',
    sku: 'TECH-KB-005',
    type: 'simple' as const,
    status: 'publish' as const,
    regular_price: 4499,
    sale_price: 3999,
    stock_quantity: 35,
    manage_stock: true,
    description: '<p>Compact 75% mechanical keyboard featuring custom linear switches, south-facing RGB illumination, and aluminum top plate.</p>',
    short_description: 'Customizable 75% hot-swap keyboard with sound-dampening silicone foam.',
    image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
    brand: 'KeyCraft',
    woo_id: 102,
    sync_status: 'modified' as const,
    categories: [{ id: 5, name: 'Computer Peripherals', slug: 'computer-peripherals' }],
    product_attributes: [{ attribute_id: 3, selected_values: ['USB-C Wired'] }],
  };
  const p5Assessment = QualityScoreService.assess(p5Raw as any);
  prodStmt.run(
    p5Raw.id, p5Raw.name, p5Raw.slug, p5Raw.sku, p5Raw.type, p5Raw.status,
    p5Raw.regular_price, p5Raw.sale_price, p5Raw.stock_quantity, 1,
    p5Raw.description, p5Raw.short_description, p5Raw.image_url, p5Raw.brand,
    p5Raw.woo_id, p5Raw.sync_status, p5Assessment.score, JSON.stringify(p5Assessment.issues),
    new Date(Date.now() - 7200000).toISOString()
  );
  prodCatStmt.run(5, 5);
  prodAttrStmt.run(5, 3, JSON.stringify(['USB-C Wired']));

  // Divergent remote state in Mock WooCommerce:
  mockWooStmt.run(
    102, p5Raw.name, p5Raw.slug, p5Raw.sku, 'simple', 'publish',
    3499, 2999, 15, // DIVERGENT PRICE & STOCK!
    p5Raw.description, p5Raw.short_description, p5Raw.image_url, p5Raw.brand,
    JSON.stringify([{ id: 15, name: 'Computer Peripherals', slug: 'computer-peripherals' }]),
    JSON.stringify([{ name: 'Connectivity', options: ['USB-C Wired'] }])
  );

  // ========================================================
  // PRODUCT 6: SYNCED & MODIFIED
  // Stock updated in PIM, ready for quick push
  // ========================================================
  const p6Raw = {
    id: 6,
    name: 'OriginRoasts Single-Origin Ethiopian Dark Roast 500g',
    slug: 'originroasts-ethiopian-dark-roast-500g',
    sku: 'FOOD-COF-006',
    type: 'simple' as const,
    status: 'publish' as const,
    regular_price: 899,
    sale_price: 799,
    stock_quantity: 95, // Changed from 110 in remote
    manage_stock: true,
    description: '<p>Hand-harvested Yirgacheffe coffee beans offering notes of wild berries, dark cocoa, and balanced citrus acidity.</p>',
    short_description: 'Single-origin washed Ethiopian Arabica beans, roasted fresh in small batches.',
    image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&q=80',
    brand: 'OriginRoasts',
    woo_id: 103,
    sync_status: 'modified' as const,
    categories: [{ id: 6, name: 'Gourmet & Groceries', slug: 'gourmet-groceries' }],
    product_attributes: [{ attribute_id: 2, selected_values: ['Medium'] }],
  };
  const p6Assessment = QualityScoreService.assess(p6Raw as any);
  prodStmt.run(
    p6Raw.id, p6Raw.name, p6Raw.slug, p6Raw.sku, p6Raw.type, p6Raw.status,
    p6Raw.regular_price, p6Raw.sale_price, p6Raw.stock_quantity, 1,
    p6Raw.description, p6Raw.short_description, p6Raw.image_url, p6Raw.brand,
    p6Raw.woo_id, p6Raw.sync_status, p6Assessment.score, JSON.stringify(p6Assessment.issues),
    new Date(Date.now() - 14400000).toISOString()
  );
  prodCatStmt.run(6, 6);
  prodAttrStmt.run(6, 2, JSON.stringify(['Medium']));

  mockWooStmt.run(
    103, p6Raw.name, p6Raw.slug, p6Raw.sku, 'simple', 'publish',
    899, 799, 110, // Stock differs (110 vs 95)
    p6Raw.description, p6Raw.short_description, p6Raw.image_url, p6Raw.brand,
    JSON.stringify([{ id: 16, name: 'Gourmet & Groceries', slug: 'gourmet-groceries' }]),
    JSON.stringify([{ name: 'Size', options: ['Medium'] }])
  );

  // ========================================================
  // PRODUCT 7: MISSING SKU (Score ~35 - Critical Fatal Error)
  // SKU is required for Woo sync
  // ========================================================
  const p7Raw = {
    id: 7,
    name: 'Smart Ambient Rhythm LED Light Bar',
    slug: 'smart-ambient-rhythm-led-light-bar',
    sku: '', // EMPTY SKU!
    type: 'simple' as const,
    status: 'draft' as const,
    regular_price: 2499,
    sale_price: 1999,
    stock_quantity: 60,
    manage_stock: true,
    description: '<p>RGBIC dynamic light bars synchronized with music tempo and monitor backlighting.</p>',
    short_description: 'Sound-reactive RGB lighting bar with app control.',
    image_url: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80',
    brand: 'LuminaTech',
    woo_id: null,
    sync_status: 'not_synced' as const,
    categories: [{ id: 7, name: 'Smart Home & Lighting', slug: 'smart-home-lighting' }],
    product_attributes: [],
  };
  const p7Assessment = QualityScoreService.assess(p7Raw as any);
  prodStmt.run(
    p7Raw.id, p7Raw.name, p7Raw.slug, 'TEMP-NO-SKU', p7Raw.type, p7Raw.status,
    p7Raw.regular_price, p7Raw.sale_price, p7Raw.stock_quantity, 1,
    p7Raw.description, p7Raw.short_description, p7Raw.image_url, p7Raw.brand,
    null, p7Raw.sync_status, p7Assessment.score, JSON.stringify(p7Assessment.issues), null
  );
  // Specifically update SKU to empty string to test empty SKU validation
  db.prepare("UPDATE products SET sku = '' WHERE id = 7").run();
  prodCatStmt.run(7, 7);

  // 4. Initial Audit Logs
  const logStmt = db.prepare(`
    INSERT INTO sync_logs (
      product_id, product_name, entity_type, direction, action,
      status, changed_fields, request_payload, response_payload, error_message, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  logStmt.run(
    1, p1Raw.name, 'product', 'pim_to_woo', 'create',
    'success', JSON.stringify(['name', 'sku', 'regular_price', 'sale_price', 'stock_quantity']),
    JSON.stringify({ sku: 'AUDIO-APX-001', name: p1Raw.name, regular_price: '12999' }),
    JSON.stringify({ id: 101, status: 'publish' }),
    null,
    new Date(Date.now() - 3600000).toISOString()
  );

  logStmt.run(
    5, p5Raw.name, 'product', 'woo_to_pim', 'import',
    'warning', JSON.stringify(['regular_price', 'stock_quantity']),
    JSON.stringify({ woo_id: 102 }),
    JSON.stringify({ message: 'Remote divergence detected. PIM retains canonical draft.' }),
    'Discrepancy detected: Remote price ₹3499 differs from PIM price ₹4499',
    new Date(Date.now() - 7200000).toISOString()
  );

  console.log('✅ Successfully seeded 7 realistic demo products with distinct quality profiles & WooCommerce states!');
}

// Allow direct execution
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  runSeed();
  process.exit(0);
}
