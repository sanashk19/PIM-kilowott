import { Product } from '../../types/index.js';
import { getDb } from '../../db/connection.js';

export interface GuardrailValidation {
  rule: string;
  name: string;
  passed: boolean;
  blocked: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  field: string;
  reason: string;
  suggested_action?: string;
}

export interface GuardrailReport {
  valid: boolean;
  blockedCount: number;
  warningCount: number;
  passedCount: number;
  rules: GuardrailValidation[];
}

export class AIGuardrailService {
  private static PRICE_CHANGE_THRESHOLD = 0.30; // 30% max price deviation

  /**
   * Validates proposed AI changes deterministically before presenting for approval or applying to catalog.
   */
  public static validate(
    product: Product,
    proposedChanges: Array<{ field: string; before?: any; after: any }>
  ): GuardrailReport {
    const rules: GuardrailValidation[] = [];
    const db = getDb();

    // Collect effective values after applying proposed changes
    const effective: Record<string, any> = { ...product };
    for (const change of proposedChanges) {
      effective[change.field] = change.after;
    }

    // 1. SKU Check
    const sku = effective.sku ? String(effective.sku).trim() : '';
    if (!sku) {
      rules.push({
        rule: 'MISSING_SKU',
        name: 'SKU Integrity Check',
        passed: false,
        blocked: true,
        risk_level: 'HIGH',
        field: 'sku',
        reason: 'Product must have a unique non-empty SKU before syncing to WooCommerce.',
        suggested_action: 'Provide a structured SKU (e.g., AUDIO-APX-001).',
      });
    } else {
      rules.push({
        rule: 'MISSING_SKU',
        name: 'SKU Integrity Check',
        passed: true,
        blocked: false,
        risk_level: 'LOW',
        field: 'sku',
        reason: `Valid SKU present: ${sku}`,
      });
    }

    // 2. Price Change Magnitude (PRICE_CHANGE_TOO_LARGE)
    const priceChange = proposedChanges.find(c => c.field === 'regular_price' || c.field === 'price');
    if (priceChange && product.regular_price && product.regular_price > 0) {
      const oldPrice = Number(product.regular_price);
      const newPrice = Number(priceChange.after);
      const percentDiff = Math.abs(newPrice - oldPrice) / oldPrice;

      if (percentDiff > this.PRICE_CHANGE_THRESHOLD) {
        rules.push({
          rule: 'PRICE_CHANGE_TOO_LARGE',
          name: 'Price Volatility Guardrail',
          passed: false,
          blocked: true,
          risk_level: 'HIGH',
          field: 'regular_price',
          reason: `Proposed price ₹${newPrice} deviates by ${Math.round(percentDiff * 100)}% from current ₹${oldPrice} (limit: 30%).`,
          suggested_action: 'Requires explicit human supervisor approval to avoid accidental price dumping or gouging.',
        });
      } else {
        rules.push({
          rule: 'PRICE_CHANGE_TOO_LARGE',
          name: 'Price Volatility Guardrail',
          passed: true,
          blocked: false,
          risk_level: 'LOW',
          field: 'regular_price',
          reason: `Price adjustment within safe variance threshold (${Math.round(percentDiff * 100)}% <= 30%).`,
        });
      }
    }

    // 3. Price Validity (INVALID_PRICE)
    const regularPrice = effective.regular_price !== null && effective.regular_price !== undefined ? Number(effective.regular_price) : null;
    if (regularPrice === null || isNaN(regularPrice) || regularPrice <= 0) {
      rules.push({
        rule: 'INVALID_PRICE',
        name: 'Non-Negative Price Requirement',
        passed: false,
        blocked: true,
        risk_level: 'HIGH',
        field: 'regular_price',
        reason: 'Regular price must be greater than zero.',
        suggested_action: 'Set a positive numeric price.',
      });
    } else {
      rules.push({
        rule: 'INVALID_PRICE',
        name: 'Non-Negative Price Requirement',
        passed: true,
        blocked: false,
        risk_level: 'LOW',
        field: 'regular_price',
        reason: `Valid positive price: ₹${regularPrice}`,
      });
    }

    // 4. Inventory Stock Guardrail (INVALID_STOCK)
    const stock = effective.stock_quantity !== undefined ? Number(effective.stock_quantity) : 0;
    if (stock < 0) {
      rules.push({
        rule: 'INVALID_STOCK',
        name: 'Inventory Bounds Check',
        passed: false,
        blocked: true,
        risk_level: 'HIGH',
        field: 'stock_quantity',
        reason: 'Stock quantity cannot be negative.',
        suggested_action: 'Set inventory count to 0 or positive integer.',
      });
    } else {
      rules.push({
        rule: 'INVALID_STOCK',
        name: 'Inventory Bounds Check',
        passed: true,
        blocked: false,
        risk_level: 'LOW',
        field: 'stock_quantity',
        reason: `Valid stock inventory: ${stock} units`,
      });
    }

    // 5. Category Taxonomy Validation (CATEGORY_MISMATCH)
    const categoryChange = proposedChanges.find(c => c.field === 'category_ids' || c.field === 'category' || c.field === 'categories');
    if (categoryChange) {
      const validCategories = db.prepare('SELECT id, name FROM categories').all() as Array<{ id: number; name: string }>;
      const validNames = validCategories.map(c => c.name.toLowerCase());
      const validIds = validCategories.map(c => c.id);

      let categoryValid = true;
      if (Array.isArray(categoryChange.after)) {
        for (const cat of categoryChange.after) {
          if (typeof cat === 'number' && !validIds.includes(cat)) {
            categoryValid = false;
          } else if (typeof cat === 'string' && !validNames.includes(cat.toLowerCase())) {
            categoryValid = false;
          }
        }
      }

      if (!categoryValid) {
        rules.push({
          rule: 'CATEGORY_MISMATCH',
          name: 'Taxonomy Conformance',
          passed: false,
          blocked: true,
          risk_level: 'MEDIUM',
          field: 'categories',
          reason: 'Proposed category does not exist in store taxonomy.',
          suggested_action: 'Map to an existing category or create category in taxonomy settings first.',
        });
      } else {
        rules.push({
          rule: 'CATEGORY_MISMATCH',
          name: 'Taxonomy Conformance',
          passed: true,
          blocked: false,
          risk_level: 'LOW',
          field: 'categories',
          reason: 'Proposed category exists in verified store taxonomy.',
        });
      }
    }

    // 6. Image Requirement
    const image = effective.image_url ? String(effective.image_url).trim() : '';
    if (!image) {
      rules.push({
        rule: 'IMAGE_REQUIRED',
        name: 'Storefront Imagery Policy',
        passed: false,
        blocked: false, // warning, doesn't block sync unless configured strict
        risk_level: 'MEDIUM',
        field: 'image_url',
        reason: 'Product has no primary image URL attached.',
        suggested_action: 'Attach a primary product image before pushing to production storefront.',
      });
    } else {
      rules.push({
        rule: 'IMAGE_REQUIRED',
        name: 'Storefront Imagery Policy',
        passed: true,
        blocked: false,
        risk_level: 'LOW',
        field: 'image_url',
        reason: 'Primary product image verified.',
      });
    }

    // 7. Description Depth
    const desc = effective.description ? String(effective.description).trim() : '';
    if (!desc) {
      rules.push({
        rule: 'EMPTY_DESCRIPTION',
        name: 'Product Narrative Policy',
        passed: false,
        blocked: false,
        risk_level: 'MEDIUM',
        field: 'description',
        reason: 'Product description is empty.',
        suggested_action: 'Generate rich HTML description to maximize customer conversion.',
      });
    }

    const blockedCount = rules.filter(r => !r.passed && r.blocked).length;
    const warningCount = rules.filter(r => !r.passed && !r.blocked).length;
    const passedCount = rules.filter(r => r.passed).length;

    return {
      valid: blockedCount === 0,
      blockedCount,
      warningCount,
      passedCount,
      rules,
    };
  }
}
