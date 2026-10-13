import { ProductRepository } from '../repositories/productRepository.js';
import { SyncLogRepository } from '../repositories/syncLogRepository.js';
import { WooCommerceFactory } from '../adapters/WooCommerceFactory.js';
import { WooProductPayload } from '../adapters/WooCommerceClient.js';
import {
  DiffItem,
  PreFlightDiffResponse,
  Product,
  ThreeWayStatus,
  SyncChangeset,
} from '../types/index.js';
import { QualityScoreService } from './qualityScoreService.js';
import {
  valuesEqual,
  formatFieldValue,
  normalizeProductField,
} from '../utils/diffUtils.js';
import { PolicyService } from './policyService.js';
import { BlastRadiusService } from './blastRadiusService.js';

export class SyncService {
  /**
   * Evaluates Three-Way Diff: BASELINE vs PIM vs WOOCOMMERCE
   */
  public static async getPreFlightDiff(productId: number): Promise<PreFlightDiffResponse> {
    const product = ProductRepository.getById(productId);
    if (!product) {
      throw new Error(`Product #${productId} not found`);
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

    // Baseline snapshot from last sync (fallback to remote if product was previously synced)
    let baseline: Record<string, any> | null = product.baseline_snapshot || null;
    if (!baseline && product.sync_status === 'synced' && remote) {
      baseline = {
        name: remote.name,
        sku: remote.sku,
        regular_price: remote.regular_price,
        sale_price: remote.sale_price,
        stock_quantity: remote.stock_quantity,
        description: remote.description,
        categories: remote.categories?.map((c: any) => c.name),
        brand: remote.brand,
      };
    }

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

    // Helper: Three-way field evaluation
    const evaluateThreeWay = (
      field: string,
      label: string,
      rawPim: any,
      rawRemote: any,
      rawBaseline: any
    ) => {
      const pimNorm = normalizeProductField(field, rawPim);
      const wooNorm = normalizeProductField(field, rawRemote);
      const baseNorm = rawBaseline !== undefined && rawBaseline !== null
        ? normalizeProductField(field, rawBaseline)
        : null;

      const formattedPim = formatFieldValue(field, pimNorm);
      const formattedWoo = formatFieldValue(field, wooNorm);
      const formattedBase = formatFieldValue(field, baseNorm);

      let status: ThreeWayStatus = 'MATCH';
      let diff_type: DiffItem['diff_type'] = 'unchanged';
      let is_different = false;

      if (isCreate) {
        status = 'NEW';
        diff_type = pimNorm !== null ? 'new' : 'unchanged';
        is_different = Boolean(pimNorm !== null);
      } else if (baseNorm !== null) {
        const pimChanged = !valuesEqual(pimNorm, baseNorm);
        const wooChanged = !valuesEqual(wooNorm, baseNorm);

        if (!pimChanged && !wooChanged) {
          status = 'MATCH';
          diff_type = 'unchanged';
          is_different = false;
        } else if (pimChanged && !wooChanged) {
          status = 'PIM_CHANGED';
          diff_type = 'modified';
          is_different = true;
        } else if (!pimChanged && wooChanged) {
          status = 'WOO_CHANGED';
          diff_type = 'modified';
          is_different = true;
        } else {
          // Both changed vs baseline
          if (valuesEqual(pimNorm, wooNorm)) {
            status = 'MATCH';
            diff_type = 'unchanged';
            is_different = false;
          } else {
            status = 'CONFLICT';
            diff_type = 'conflict';
            is_different = true;
          }
        }
      } else {
        // No baseline snapshot available yet: compare PIM vs Woo directly
        if (valuesEqual(pimNorm, wooNorm)) {
          status = 'MATCH';
          diff_type = 'unchanged';
          is_different = false;
        } else {
          status = 'CONFLICT';
          diff_type = 'conflict';
          is_different = true;
        }
      }

      // Check field ownership policy
      const policyOwner = PolicyService.getFieldOwnership(field);
      let recommendedResolution: 'keep_pim' | 'keep_woo' | 'manual' = 'keep_pim';
      let resolutionReason = '';

      if (status === 'CONFLICT') {
        if (policyOwner === 'PIM') {
          recommendedResolution = 'keep_pim';
          resolutionReason = `Policy assigns ${label} to PIM as canonical source-of-truth.`;
        } else {
          recommendedResolution = 'keep_woo';
          resolutionReason = `Policy assigns ${label} to WooCommerce as canonical source-of-truth.`;
        }
      } else if (status === 'PIM_CHANGED') {
        recommendedResolution = 'keep_pim';
        resolutionReason = 'PIM contains newer changes; push to WooCommerce.';
      } else if (status === 'WOO_CHANGED') {
        recommendedResolution = 'keep_woo';
        resolutionReason = 'WooCommerce contains newer changes; pull into PIM.';
      }

      diffs.push({
        field,
        label,
        baseline_value: formattedBase,
        pim_value: formattedPim,
        woo_value: formattedWoo,
        is_different,
        diff_type,
        three_way_status: status,
        policy_owner: policyOwner,
        recommended_resolution: recommendedResolution,
        resolution_reason: resolutionReason,
      });
    };

    // 1. Product Name
    evaluateThreeWay('name', 'Product Title', product.name, remote?.name, baseline?.name);

    // 2. SKU
    evaluateThreeWay('sku', 'SKU', product.sku, remote?.sku, baseline?.sku);

    // 3. Regular Price
    evaluateThreeWay(
      'regular_price',
      'Regular Price',
      product.regular_price,
      remote?.regular_price,
      baseline?.regular_price
    );

    // 4. Sale Price
    evaluateThreeWay(
      'sale_price',
      'Sale Price',
      product.sale_price,
      remote?.sale_price,
      baseline?.sale_price
    );

    // 5. Stock Quantity
    evaluateThreeWay(
      'stock_quantity',
      'Inventory Stock',
      product.stock_quantity,
      remote?.stock_quantity,
      baseline?.stock_quantity
    );

    // 6. Categories
    const pimCat = product.categories?.map(c => c.name) || [];
    const wooCat = remote?.categories?.map((c: any) => c.name) || [];
    const baseCat = baseline?.categories || [];
    evaluateThreeWay('categories', 'Categories', pimCat, wooCat, baseCat);

    // 7. Brand
    evaluateThreeWay('brand', 'Brand', product.brand, remote?.brand, baseline?.brand);

    // 8. Description
    evaluateThreeWay(
      'description',
      'Description',
      product.description,
      remote?.description,
      baseline?.description
    );

    // 9. Attributes
    const pimAttrs = product.product_attributes?.map(a => `${a.attribute?.name || 'Attr'}: ${a.selected_values.join('/')}`) || [];
    const wooAttrs = remote?.attributes?.map((a: any) => `${a.name}: ${a.options.join('/')}`) || [];
    const baseAttrs = baseline?.attributes || [];
    evaluateThreeWay('attributes', 'Attributes', pimAttrs, wooAttrs, baseAttrs);

    // Blast-Radius impact calculation
    const blastRadius = BlastRadiusService.calculate(diffs, 1);

    // Overall Recommended Resolution
    const conflictingFields = diffs.filter(d => d.three_way_status === 'CONFLICT').map(d => d.field);
    const overallPolicy = PolicyService.getRecommendedResolution(conflictingFields);

    // Payload Preview
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
    const hasConflicts = diffs.some(d => d.three_way_status === 'CONFLICT');
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
      blast_radius: blastRadius,
      recommended_action: overallPolicy.recommendation,
      payload_preview: payloadPreview as any,
      remote_state: remote,
      baseline_snapshot: baseline,
    };
  }

  /**
   * Pushes PIM product to WooCommerce with baseline snapshot and immutable audit ledger.
   */
  public static async pushProduct(
    productId: number,
    options: { changesetId?: string; actor?: string } = {}
  ): Promise<{ success: boolean; message: string; woo_id: number; product: Product }> {
    const product = ProductRepository.getById(productId);
    if (!product) {
      throw new Error(`Product #${productId} not found`);
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
    let currentRemote: any = null;
    if (product.woo_id) {
      try {
        currentRemote = await client.getProduct(product.woo_id);
      } catch (_) {}
    }

    // Snapshot current state for rollback capability
    const previousSnapshot: Record<string, any> = {
      name: product.name,
      sku: product.sku,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock_quantity: product.stock_quantity,
      description: product.description,
      brand: product.brand,
      image_url: product.image_url,
      remote_state: currentRemote,
    };

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

      // New baseline snapshot representing successful sync state
      const newBaselineSnapshot: Record<string, any> = {
        name: product.name,
        sku: product.sku,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        description: product.description,
        categories: product.categories?.map(c => c.name),
        brand: product.brand,
        synced_at: now,
      };

      // Update PIM product
      const updatedProduct = ProductRepository.update(product.id, {
        woo_id: assignedWooId,
        sync_status: 'synced',
        last_synced_at: now,
        baseline_snapshot: newBaselineSnapshot,
      })!;

      // Create Immutable Audit Log with Rollback Snapshot
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
        previous_snapshot: previousSnapshot,
        changeset_id: options.changesetId || `cs_${Date.now()}`,
      });

      return {
        success: true,
        message: `Successfully ${isUpdate ? 'updated' : 'created'} product in WooCommerce (ID: ${assignedWooId})`,
        woo_id: assignedWooId,
        product: updatedProduct,
      };
    } catch (err: any) {
      ProductRepository.update(product.id, { sync_status: 'error' });

      SyncLogRepository.create({
        product_id: product.id,
        product_name: product.name,
        entity_type: 'product',
        direction: 'pim_to_woo',
        action,
        status: 'failed',
        request_payload: payload as any,
        previous_snapshot: previousSnapshot,
        changeset_id: options.changesetId || null,
        error_message: err.message || 'WooCommerce API sync failed',
      });

      throw err;
    }
  }

  /**
   * One-Click Rollback: Reverts product state to before the designated sync operation
   * without mutating or deleting the historical audit trail.
   */
  public static async rollbackSync(logId: number): Promise<{
    success: boolean;
    message: string;
    product: Product;
  }> {
    const log = SyncLogRepository.getById(logId);
    if (!log) {
      throw new Error(`Sync log #${logId} not found.`);
    }

    if (!log.product_id) {
      throw new Error(`Sync log #${logId} is not linked to an active product.`);
    }

    const product = ProductRepository.getById(log.product_id);
    if (!product) {
      throw new Error(`Product #${log.product_id} no longer exists.`);
    }

    const previousSnapshot = log.previous_snapshot;
    if (!previousSnapshot) {
      throw new Error(`No previous snapshot available for sync record #${logId}. Cannot safely revert.`);
    }

    // Capture current state before rolling back
    const preRollbackState = {
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock_quantity: product.stock_quantity,
      description: product.description,
      brand: product.brand,
    };

    // Reconstruct fields to restore
    const restoredFields: Partial<Product> = {};
    if (previousSnapshot.regular_price !== undefined) restoredFields.regular_price = previousSnapshot.regular_price;
    if (previousSnapshot.sale_price !== undefined) restoredFields.sale_price = previousSnapshot.sale_price;
    if (previousSnapshot.stock_quantity !== undefined) restoredFields.stock_quantity = previousSnapshot.stock_quantity;
    if (previousSnapshot.description !== undefined) restoredFields.description = previousSnapshot.description;
    if (previousSnapshot.brand !== undefined) restoredFields.brand = previousSnapshot.brand;

    // Apply restored values to PIM
    const restoredProduct = ProductRepository.update(product.id, {
      ...restoredFields,
      sync_status: 'modified',
    })!;

    // Recalculate Quality Score
    const newAssessment = QualityScoreService.assess(restoredProduct);
    ProductRepository.update(product.id, {
      quality_score: newAssessment.score,
      quality_issues: newAssessment.issues,
    });

    // If product has a WooCommerce ID, restore remote WooCommerce values as well
    if (product.woo_id) {
      const client = WooCommerceFactory.getClient();
      try {
        await client.updateProduct(product.woo_id, {
          regular_price: restoredFields.regular_price !== null && restoredFields.regular_price !== undefined
            ? String(restoredFields.regular_price)
            : undefined,
          sale_price: restoredFields.sale_price !== null && restoredFields.sale_price !== undefined
            ? String(restoredFields.sale_price)
            : undefined,
          stock_quantity: restoredFields.stock_quantity,
          description: restoredFields.description,
        });
      } catch (e) {
        console.warn(`Could not push rollback to WooCommerce #${product.woo_id}`, e);
      }
    }

    // Append NEW Rollback Audit Record (Never mutate or delete original log)
    SyncLogRepository.create({
      product_id: product.id,
      product_name: product.name,
      entity_type: 'product',
      direction: 'rollback',
      action: 'rollback',
      status: 'success',
      changed_fields: Object.keys(restoredFields),
      request_payload: {
        rolledBackLogId: logId,
        previousState: preRollbackState,
        restoredState: restoredFields,
      },
      response_payload: {
        message: `Successfully rolled back product state to snapshot from Sync #${logId}.`,
      },
    });

    const finalProduct = ProductRepository.getById(product.id)!;

    return {
      success: true,
      message: `Successfully rolled back Product "${product.name}" to its state prior to Sync #${logId}.`,
      product: finalProduct,
    };
  }

  /**
   * Resolves conflicts according to user decision or Source-of-Truth policies.
   */
  public static async resolveConflict(
    productId: number,
    resolution: 'keep_pim' | 'keep_woo'
  ): Promise<{ success: boolean; message: string; product: Product }> {
    const product = ProductRepository.getById(productId);
    if (!product || !product.woo_id) {
      throw new Error(`Product #${productId} with WooCommerce link not found.`);
    }

    const client = WooCommerceFactory.getClient();
    const remote = await client.getProduct(product.woo_id);
    if (!remote) {
      throw new Error(`Remote WooCommerce product #${product.woo_id} not found.`);
    }

    if (resolution === 'keep_pim') {
      // Overwrite remote with PIM values and update baseline
      await this.pushProduct(productId);

      SyncLogRepository.create({
        product_id: product.id,
        product_name: product.name,
        entity_type: 'product',
        direction: 'pim_to_woo',
        action: 'conflict_resolved',
        status: 'success',
        changed_fields: ['regular_price', 'stock_quantity', 'description'],
        request_payload: { resolution: 'keep_pim', canonical_source: 'VERIDEX (PIM)' },
        response_payload: { message: 'Overwrote remote WooCommerce values with canonical PIM data.' },
      });

      return {
        success: true,
        message: 'Conflict resolved: PIM values established as canonical truth and pushed to WooCommerce.',
        product: ProductRepository.getById(productId)!,
      };
    } else {
      // 'keep_woo': update PIM with remote values
      const newRegularPrice = remote.regular_price ? Number(remote.regular_price) : product.regular_price;
      const newSalePrice = remote.sale_price ? Number(remote.sale_price) : null;
      const newStock = remote.stock_quantity ?? product.stock_quantity;
      const newDesc = remote.description || product.description;

      const newBaseline: Record<string, any> = {
        name: remote.name || product.name,
        sku: remote.sku || product.sku,
        regular_price: newRegularPrice,
        sale_price: newSalePrice,
        stock_quantity: newStock,
        description: newDesc,
        synced_at: new Date().toISOString(),
      };

      const updated = ProductRepository.update(productId, {
        regular_price: newRegularPrice,
        sale_price: newSalePrice,
        stock_quantity: newStock,
        description: newDesc,
        sync_status: 'synced',
        baseline_snapshot: newBaseline,
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
        changed_fields: ['regular_price', 'sale_price', 'stock_quantity', 'description'],
        request_payload: { resolution: 'keep_woo', remote_values: { price: newRegularPrice, stock: newStock } },
        response_payload: { message: 'Updated VERIDEX catalog with external WooCommerce values.' },
      });

      return {
        success: true,
        message: 'Conflict resolved: PIM updated with WooCommerce values and catalog synchronized.',
        product: ProductRepository.getById(productId)!,
      };
    }
  }

  public static async pushBatch(productIds: number[]): Promise<{ total: number; synced: number; failed: number; details: any[] }> {
    let synced = 0;
    let failed = 0;
    const details: any[] = [];
    const batchChangesetId = `cs_batch_${Date.now()}`;

    for (const id of productIds) {
      try {
        const res = await this.pushProduct(id, { changesetId: batchChangesetId });
        synced++;
        details.push({ id, status: 'synced', message: res.message });
      } catch (err: any) {
        failed++;
        details.push({ id, status: 'failed', error: err.message });
      }
    }

    return { total: productIds.length, synced, failed, details };
  }
}
