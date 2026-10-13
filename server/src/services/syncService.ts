import { ProductRepository } from '../repositories/productRepository.js';
import { SyncLogRepository } from '../repositories/syncLogRepository.js';
import { WooCommerceFactory } from '../adapters/WooCommerceFactory.js';
import { WooProductPayload } from '../adapters/WooCommerceClient.js';
import { DiffItem, PreFlightDiffResponse, Product } from '../types/index.js';
import { QualityScoreService } from './qualityScoreService.js';

export class SyncService {
  public static async getPreFlightDiff(productId: number): Promise<PreFlightDiffResponse> {
    const product = ProductRepository.getById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const client = WooCommerceFactory.getClient();
    let remote: any = null;

    if (product.woo_id) {
      try {
        remote = await client.getProduct(product.woo_id);
      } catch (e) {
        console.warn(`Could not fetch remote product for woo_id ${product.woo_id}`, e);
        remote = null;
      }
    }

    const isCreate = !remote;
    const action: 'create' | 'update' = isCreate ? 'create' : 'update';

    const diffs: DiffItem[] = [];
    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    // Validations
    if (!product.sku || product.sku.trim() === '') {
      validationErrors.push('Missing SKU: WooCommerce requires a unique SKU identifier.');
    }
    if (!product.name || product.name.trim() === '') {
      validationErrors.push('Missing Title: Product title is required.');
    }
    if (product.regular_price === null || product.regular_price <= 0) {
      validationErrors.push('Invalid Price: Regular price must be greater than zero.');
    }
    if (product.sale_price !== null && product.regular_price !== null && product.sale_price >= product.regular_price) {
      validationErrors.push(`Pricing Anomaly: Sale price (₹${product.sale_price}) cannot exceed regular price (₹${product.regular_price}).`);
    }
    if (!product.categories || product.categories.length === 0) {
      validationWarnings.push('Category unassigned: Product will be placed in Default Uncategorized in WooCommerce.');
    }
    if (!product.image_url) {
      validationWarnings.push('Missing Image: Product will have no thumbnail on the storefront.');
    }

    // Helper to evaluate field diff
    const evaluateField = (
      field: string,
      label: string,
      pimVal: string,
      remoteVal: string,
      isNumeric: boolean = false
    ) => {
      const normalizedPim = pimVal.trim();
      const normalizedRemote = remoteVal.trim();

      if (isCreate) {
        diffs.push({
          field,
          label,
          pim_value: normalizedPim || '—',
          woo_value: '—',
          is_different: Boolean(normalizedPim),
          diff_type: normalizedPim ? 'new' : 'unchanged',
        });
        return;
      }

      const match = isNumeric
        ? Number(normalizedPim || 0) === Number(normalizedRemote || 0)
        : normalizedPim === normalizedRemote;

      if (match) {
        diffs.push({
          field,
          label,
          pim_value: normalizedPim || '—',
          woo_value: normalizedRemote || '—',
          is_different: false,
          diff_type: 'unchanged',
        });
      } else {
        // Detect conflict scenario
        // If remote price or stock differs while PIM was not recently pushed
        const isConflictCandidate = (field === 'regular_price' || field === 'stock_quantity' || field === 'price')
          && normalizedRemote !== ''
          && normalizedRemote !== '0'
          && product.sync_status === 'modified';

        diffs.push({
          field,
          label,
          pim_value: normalizedPim || '—',
          woo_value: normalizedRemote || '—',
          is_different: true,
          diff_type: isConflictCandidate ? 'conflict' : 'modified',
        });
      }
    };

    // 1. Product Name
    evaluateField('name', 'Product Title', product.name, remote?.name || '');

    // 2. SKU
    evaluateField('sku', 'SKU', product.sku, remote?.sku || '');

    // 3. Regular Price
    evaluateField(
      'regular_price',
      'Regular Price',
      product.regular_price !== null ? `₹${product.regular_price}` : '',
      remote?.regular_price ? `₹${remote.regular_price}` : '',
      true
    );

    // 4. Sale Price
    evaluateField(
      'sale_price',
      'Sale Price',
      product.sale_price !== null ? `₹${product.sale_price}` : '',
      remote?.sale_price ? `₹${remote.sale_price}` : '',
      true
    );

    // 5. Stock Quantity
    evaluateField(
      'stock_quantity',
      'Inventory Stock',
      `${product.stock_quantity ?? 0} units`,
      remote ? `${remote.stock_quantity ?? 0} units` : '',
      true
    );

    // 6. Category
    const pimCat = product.categories?.map(c => c.name).join(', ') || '';
    const wooCat = remote?.categories?.map((c: any) => c.name).join(', ') || '';
    evaluateField('category', 'Categories', pimCat, wooCat);

    // 7. Brand
    evaluateField('brand', 'Brand', product.brand || '', remote?.brand || '');

    // 8. Description
    const pimDescSnippet = product.description ? product.description.replace(/<[^>]*>/g, '').slice(0, 100) + '...' : '';
    const wooDescSnippet = remote?.description ? remote.description.replace(/<[^>]*>/g, '').slice(0, 100) + '...' : '';
    evaluateField('description', 'Description', pimDescSnippet, wooDescSnippet);

    // 9. Attributes
    const pimAttrs = product.product_attributes?.map(a => `${a.attribute?.name || 'Attr'}: ${a.selected_values.join('/')}`).join('; ') || '';
    const wooAttrs = remote?.attributes?.map((a: any) => `${a.name}: ${a.options.join('/')}`).join('; ') || '';
    evaluateField('attributes', 'Attributes', pimAttrs, wooAttrs);

    // Build Payload Preview (what would be sent to WooCommerce REST API)
    const payloadPreview: WooProductPayload = {
      name: product.name,
      sku: product.sku,
      type: product.type,
      status: product.status,
      regular_price: product.regular_price !== null ? String(product.regular_price) : undefined,
      sale_price: product.sale_price !== null ? String(product.sale_price) : undefined,
      stock_quantity: product.stock_quantity,
      manage_stock: product.manage_stock,
      description: product.description,
      short_description: product.short_description,
      images: product.image_url ? [{ src: product.image_url }] : [],
      categories: product.categories?.map(c => ({ id: c.woo_id, name: c.name, slug: c.slug })),
      attributes: product.product_attributes?.map(pa => ({
        name: pa.attribute?.name || 'Attribute',
        options: pa.selected_values,
        visible: true,
        variation: Boolean(pa.is_variation),
      })),
    };

    const hasChanges = diffs.some(d => d.is_different);
    const hasConflicts = diffs.some(d => d.diff_type === 'conflict');
    const isReady = validationErrors.length === 0;

    return {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      action,
      woo_id: product.woo_id,
      is_ready: isReady,
      has_changes: hasChanges,
      has_conflicts: hasConflicts,
      validation_errors: validationErrors,
      validation_warnings: validationWarnings,
      diffs,
      payload_preview: payloadPreview as any,
      remote_state: remote,
    };
  }

  public static async pushProduct(productId: number): Promise<{ success: boolean; message: string; woo_id: number; product: Product }> {
    const product = ProductRepository.getById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Pre-flight validation gate
    if (!product.sku || product.sku.trim() === '') {
      throw new Error('Validation failed: Product must have a valid SKU before pushing to WooCommerce.');
    }
    if (product.regular_price === null || product.regular_price <= 0) {
      throw new Error('Validation failed: Product must have a positive regular price.');
    }
    if (product.sale_price !== null && product.sale_price >= product.regular_price) {
      throw new Error(`Validation failed: Sale price (₹${product.sale_price}) cannot be higher or equal to regular price (₹${product.regular_price}).`);
    }

    const client = WooCommerceFactory.getClient();

    const payload: WooProductPayload = {
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      type: product.type,
      status: product.status,
      regular_price: product.regular_price !== null ? String(product.regular_price) : '0',
      sale_price: product.sale_price !== null ? String(product.sale_price) : undefined,
      stock_quantity: product.stock_quantity,
      manage_stock: product.manage_stock,
      description: product.description,
      short_description: product.short_description,
      images: product.image_url ? [{ src: product.image_url }] : [],
      categories: product.categories?.map(c => ({ id: c.woo_id, name: c.name, slug: c.slug })),
      attributes: product.product_attributes?.map(pa => ({
        name: pa.attribute?.name || 'Attribute',
        options: pa.selected_values,
        visible: true,
        variation: Boolean(pa.is_variation),
      })),
    };

    const isUpdate = Boolean(product.woo_id);
    const action = isUpdate ? 'update' : 'create';

    try {
      let response: any;
      if (isUpdate) {
        response = await client.updateProduct(product.woo_id!, payload);
      } else {
        response = await client.createProduct(payload);
      }

      const assignedWooId = response.id;
      const now = new Date().toISOString();

      // Update PIM product sync status
      const updatedProduct = ProductRepository.update(product.id, {
        woo_id: assignedWooId,
        sync_status: 'synced',
        last_synced_at: now,
      })!;

      // Log success
      SyncLogRepository.create({
        product_id: product.id,
        product_name: product.name,
        entity_type: 'product',
        direction: 'pim_to_woo',
        action,
        status: 'success',
        changed_fields: ['name', 'sku', 'regular_price', 'sale_price', 'stock_quantity', 'categories', 'description'],
        request_payload: payload as any,
        response_payload: response,
      });

      return {
        success: true,
        message: `Successfully ${isUpdate ? 'updated' : 'created'} product in WooCommerce (ID: ${assignedWooId})`,
        woo_id: assignedWooId,
        product: updatedProduct,
      };
    } catch (err: any) {
      // Mark error status on product
      ProductRepository.update(product.id, { sync_status: 'error' });

      // Log failure in audit trail
      SyncLogRepository.create({
        product_id: product.id,
        product_name: product.name,
        entity_type: 'product',
        direction: 'pim_to_woo',
        action,
        status: 'failed',
        request_payload: payload as any,
        error_message: err.message || 'WooCommerce API sync failed',
      });

      throw err;
    }
  }

  public static async resolveConflict(
    productId: number,
    resolution: 'keep_pim' | 'keep_woo'
  ): Promise<{ success: boolean; message: string; product: Product }> {
    const product = ProductRepository.getById(productId);
    if (!product || !product.woo_id) {
      throw new Error(`Product ${productId} with WooCommerce link not found.`);
    }

    const client = WooCommerceFactory.getClient();
    const remote = await client.getProduct(product.woo_id);
    if (!remote) {
      throw new Error(`Remote WooCommerce product ${product.woo_id} not found.`);
    }

    if (resolution === 'keep_pim') {
      // Overwrite remote with PIM values
      await this.pushProduct(productId);

      SyncLogRepository.create({
        product_id: product.id,
        product_name: product.name,
        entity_type: 'product',
        direction: 'pim_to_woo',
        action: 'conflict_resolved',
        status: 'success',
        changed_fields: ['regular_price', 'stock_quantity'],
        request_payload: { resolution: 'keep_pim', canonical_source: 'PIM Sentinel' },
        response_payload: { message: 'Overwrote remote WooCommerce values with canonical PIM data.' },
      });

      const refreshed = ProductRepository.getById(productId)!;
      return {
        success: true,
        message: 'Conflict resolved: PIM values pushed and established as canonical truth.',
        product: refreshed,
      };
    } else {
      // 'keep_woo': update PIM with remote values
      const newRegularPrice = remote.regular_price ? Number(remote.regular_price) : product.regular_price;
      const newSalePrice = remote.sale_price ? Number(remote.sale_price) : null;
      const newStock = remote.stock_quantity ?? product.stock_quantity;

      const updated = ProductRepository.update(productId, {
        regular_price: newRegularPrice,
        sale_price: newSalePrice,
        stock_quantity: newStock,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      })!;

      // Recalculate quality score
      const assessment = QualityScoreService.assess(updated);
      ProductRepository.update(productId, {
        quality_score: assessment.score,
        quality_issues: assessment.issues,
      });

      SyncLogRepository.create({
        product_id: product.id,
        product_name: product.name,
        entity_type: 'product',
        direction: 'woo_to_pim',
        action: 'conflict_resolved',
        status: 'success',
        changed_fields: ['regular_price', 'sale_price', 'stock_quantity'],
        request_payload: { resolution: 'keep_woo', remote_values: { price: newRegularPrice, stock: newStock } },
        response_payload: { message: 'Updated PIM Sentinel catalog with external WooCommerce values.' },
      });

      return {
        success: true,
        message: 'Conflict resolved: PIM updated with WooCommerce values and catalog synchronized.',
        product: ProductRepository.getById(productId)!,
      };
    }
  }

  public static async importProduct(wooId: number): Promise<Product> {
    const client = WooCommerceFactory.getClient();
    const remote = await client.getProduct(wooId);
    if (!remote) {
      throw new Error(`WooCommerce product ${wooId} not found.`);
    }

    const existing = ProductRepository.getAll().find(p => p.woo_id === wooId || p.sku === remote.sku);

    const priceNum = remote.regular_price ? Number(remote.regular_price) : 0;
    const saleNum = remote.sale_price ? Number(remote.sale_price) : null;

    let product: Product;

    if (existing) {
      product = ProductRepository.update(existing.id, {
        name: remote.name,
        slug: remote.slug,
        sku: remote.sku || existing.sku,
        regular_price: priceNum,
        sale_price: saleNum,
        stock_quantity: remote.stock_quantity ?? 0,
        description: remote.description,
        short_description: remote.short_description,
        image_url: remote.images && remote.images[0] ? remote.images[0].src : undefined,
        woo_id: remote.id,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      })!;
    } else {
      product = ProductRepository.create({
        name: remote.name,
        slug: remote.slug,
        sku: remote.sku || `WOO-${remote.id}`,
        regular_price: priceNum,
        sale_price: saleNum,
        stock_quantity: remote.stock_quantity ?? 0,
        description: remote.description,
        short_description: remote.short_description,
        image_url: remote.images && remote.images[0] ? remote.images[0].src : undefined,
        woo_id: remote.id,
        sync_status: 'synced',
        last_synced_at: new Date().toISOString(),
      });
    }

    SyncLogRepository.create({
      product_id: product.id,
      product_name: product.name,
      entity_type: 'product',
      direction: 'woo_to_pim',
      action: 'import',
      status: 'success',
      changed_fields: ['name', 'regular_price', 'stock_quantity'],
      response_payload: remote as any,
    });

    return product;
  }

  public static async pushBatch(productIds: number[]): Promise<{ total: number; synced: number; failed: number; details: any[] }> {
    let synced = 0;
    let failed = 0;
    const details: any[] = [];

    for (const id of productIds) {
      try {
        const res = await this.pushProduct(id);
        synced++;
        details.push({ id, status: 'synced', message: res.message });
      } catch (err: any) {
        failed++;
        details.push({ id, status: 'failed', error: err.message });
      }
    }

    return { total: productIds.length, synced, failed, details };
  }

  public static async importAll(): Promise<{ total: number; imported: number; updated: number; message: string }> {
    const client = WooCommerceFactory.getClient();
    const remoteList = await client.getProducts();

    let imported = 0;
    let updated = 0;

    for (const item of remoteList) {
      const existing = ProductRepository.getAll().find(p => p.woo_id === item.id || p.sku === item.sku);
      if (existing) {
        await this.importProduct(item.id);
        updated++;
      } else {
        await this.importProduct(item.id);
        imported++;
      }
    }

    return {
      total: remoteList.length,
      imported,
      updated,
      message: `Completed full bidirectional import: ${imported} imported, ${updated} updated.`,
    };
  }
}
