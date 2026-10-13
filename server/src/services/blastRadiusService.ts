import { DiffItem, BlastRadiusImpact, RiskLevel } from '../types/index.js';

export class BlastRadiusService {
  /**
   * Deterministically calculates the blast radius impact for a given set of field diffs.
   */
  public static calculate(diffs: DiffItem[], affectedProductCount: number = 1): BlastRadiusImpact {
    let priceChangesCount = 0;
    let stockChangesCount = 0;
    let categoryChangesCount = 0;
    let conflictsCount = 0;
    let hasHighPriceDeviation = false;
    let hasStockDropToZero = false;

    for (const diff of diffs) {
      if (!diff.is_different && diff.diff_type === 'unchanged') {
        continue;
      }

      if (diff.diff_type === 'conflict' || diff.three_way_status === 'CONFLICT') {
        conflictsCount++;
      }

      if (diff.field === 'regular_price' || diff.field === 'sale_price' || diff.field === 'price') {
        priceChangesCount++;
        const pNum = Number(String(diff.pim_value).replace(/[^0-9.-]+/g, ''));
        const wNum = Number(String(diff.woo_value).replace(/[^0-9.-]+/g, ''));
        if (pNum > 0 && wNum > 0) {
          const deviation = Math.abs(pNum - wNum) / Math.min(pNum, wNum);
          if (deviation > 0.3) {
            hasHighPriceDeviation = true;
          }
        }
      }

      if (diff.field === 'stock_quantity') {
        stockChangesCount++;
        const pStock = Number(String(diff.pim_value).replace(/[^0-9.-]+/g, ''));
        if (pStock === 0) {
          hasStockDropToZero = true;
        }
      }

      if (diff.field === 'category' || diff.field === 'categories') {
        categoryChangesCount++;
      }
    }

    // Determine Risk Level
    let risk_level: RiskLevel = 'LOW';
    let risk_reason = 'Low impact changes: purely descriptive metadata or minor attributes.';
    let recommended_action = 'Safe to apply with standard approval.';

    if (conflictsCount > 0 || hasHighPriceDeviation || hasStockDropToZero || affectedProductCount > 5) {
      risk_level = 'HIGH';
      if (conflictsCount > 0) {
        risk_reason = `High impact: ${conflictsCount} unresolved conflict(s) detected between PIM and WooCommerce.`;
        recommended_action = 'Resolve all conflicts using ownership policy before triggering live sync.';
      } else if (hasHighPriceDeviation) {
        risk_reason = 'High impact: Significant price change (>30% variance) detected.';
        recommended_action = 'Requires supervisor sign-off on pricing changes.';
      } else if (hasStockDropToZero) {
        risk_reason = 'High impact: Inventory level will transition to zero (Out of Stock).';
        recommended_action = 'Verify warehouse inventory count before publishing.';
      } else {
        risk_reason = `High impact: Large batch update affecting ${affectedProductCount} products simultaneously.`;
        recommended_action = 'Perform incremental deployment or dry-run validation.';
      }
    } else if (categoryChangesCount > 0 || priceChangesCount > 0 || stockChangesCount > 0 || affectedProductCount > 2) {
      risk_level = 'MEDIUM';
      risk_reason = 'Moderate impact: Price, inventory, or category taxonomy modifications detected.';
      recommended_action = 'Review dry-run changeset before executing sync.';
    }

    return {
      risk_level,
      risk_reason,
      affected_products_count: affectedProductCount,
      price_changes_count: priceChangesCount,
      stock_changes_count: stockChangesCount,
      category_changes_count: categoryChangesCount,
      conflicts_count: conflictsCount,
      recommended_action,
    };
  }
}
