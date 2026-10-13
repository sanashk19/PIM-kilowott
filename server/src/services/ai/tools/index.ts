import { ProductRepository } from '../../../repositories/productRepository.js';
import { QualityScoreService } from '../../qualityScoreService.js';
import { WooCommerceFactory } from '../../../adapters/WooCommerceFactory.js';
import { SyncService } from '../../syncService.js';
import { SyncLogRepository } from '../../../repositories/syncLogRepository.js';
import { Product, QualityAssessment, DiffItem } from '../../../types/index.js';

export interface AgentTool<TInput, TOutput> {
  name: string;
  description: string;
  execute(input: TInput): Promise<TOutput>;
}

// 1. inspect_product
export const inspectProductTool: AgentTool<{ productId: number }, { product: Product }> = {
  name: 'inspect_product',
  description: 'Inspects a product from the PIM database and retrieves its full attributes, taxonomy, and media.',
  async execute({ productId }) {
    const product = ProductRepository.getById(productId);
    if (!product) throw new Error(`Product ${productId} not found`);
    return { product };
  },
};

// 2. calculate_quality_score
export const calculateQualityScoreTool: AgentTool<{ product: Partial<Product> }, { assessment: QualityAssessment }> = {
  name: 'calculate_quality_score',
  description: 'Runs deterministic quality inspection (0-100) on product attributes and catalog completeness.',
  async execute({ product }) {
    const assessment = QualityScoreService.assess(product);
    return { assessment };
  },
};

// 3. get_product_attributes
export const getProductAttributesTool: AgentTool<{ productId: number }, { attributes: any[] }> = {
  name: 'get_product_attributes',
  description: 'Retrieves technical specification attributes configured for this product.',
  async execute({ productId }) {
    const product = ProductRepository.getById(productId);
    return { attributes: product?.product_attributes || [] };
  },
};

// 4. check_woocommerce_state
export const checkWooCommerceStateTool: AgentTool<{ wooId: number | null }, { remoteState: any | null; exists: boolean }> = {
  name: 'check_woocommerce_state',
  description: 'Queries remote WooCommerce store adapter for current synchronized product state.',
  async execute({ wooId }) {
    if (!wooId) return { remoteState: null, exists: false };
    const client = WooCommerceFactory.getClient();
    try {
      const remote = await client.getProduct(wooId);
      return { remoteState: remote, exists: Boolean(remote) };
    } catch {
      return { remoteState: null, exists: false };
    }
  },
};

// 5. detect_conflicts
export const detectConflictsTool: AgentTool<{ productId: number }, { hasConflicts: boolean; diffs: DiffItem[] }> = {
  name: 'detect_conflicts',
  description: 'Runs pre-flight diff inspection to identify discrepancies between PIM Sentinel and WooCommerce.',
  async execute({ productId }) {
    const preflight = await SyncService.getPreFlightDiff(productId);
    return {
      hasConflicts: preflight.has_conflicts,
      diffs: preflight.diffs,
    };
  },
};

// 6. validate_product
export const validateProductTool: AgentTool<{ product: Partial<Product> }, { valid: boolean; errors: string[] }> = {
  name: 'validate_product',
  description: 'Validates product against WooCommerce REST API v3 constraints (SKU, title, pricing sanity).',
  async execute({ product }) {
    const errors: string[] = [];
    if (!product.sku || product.sku.trim() === '') errors.push('Missing SKU identifier');
    if (!product.name || product.name.trim() === '') errors.push('Missing product title');
    if (product.regular_price === null || (product.regular_price !== undefined && product.regular_price <= 0)) {
      errors.push('Regular price must be greater than zero');
    }
    if (product.sale_price !== null && product.regular_price !== null && product.sale_price !== undefined && product.sale_price >= product.regular_price!) {
      errors.push('Sale price cannot exceed or equal regular price');
    }
    return { valid: errors.length === 0, errors };
  },
};

// 7. prepare_sync_plan
export const prepareSyncPlanTool: AgentTool<{ product: Product; issues: any[]; proposedChanges: any[] }, { plan: any }> = {
  name: 'prepare_sync_plan',
  description: 'Prepares a structured synchronization plan detailing target action and risk assessment.',
  async execute({ product, issues, proposedChanges }) {
    const action = product.woo_id ? 'update' : 'create';
    return {
      plan: {
        action,
        target: 'WooCommerce Storefront (REST API v3)',
        targetId: product.woo_id || 'New Product ID to be assigned',
        changesCount: proposedChanges.length,
        unresolvedIssuesCount: issues.length,
        requiresHumanApproval: true,
      },
    };
  },
};

// 8. execute_approved_sync
export const executeApprovedSyncTool: AgentTool<{ productId: number }, { success: boolean; woo_id: number; message: string }> = {
  name: 'execute_approved_sync',
  description: 'Executes the actual WooCommerce synchronization using the client adapter.',
  async execute({ productId }) {
    const result = await SyncService.pushProduct(productId);
    return {
      success: true,
      woo_id: result.woo_id,
      message: result.message,
    };
  },
};

// 9. write_audit_log
export const writeAuditLogTool: AgentTool<{
  productId: number;
  productName: string;
  action: string;
  status: 'success' | 'failed' | 'warning';
  changedFields: string[];
  payload?: any;
}, { logId: number }> = {
  name: 'write_audit_log',
  description: 'Writes immutable audit record for compliance and tracking.',
  async execute({ productId, productName, action, status, changedFields, payload }) {
    const log = SyncLogRepository.create({
      product_id: productId,
      product_name: productName,
      entity_type: 'product',
      direction: 'pim_to_woo',
      action,
      status,
      changed_fields: changedFields,
      request_payload: payload,
    });
    return { logId: log.id };
  },
};
