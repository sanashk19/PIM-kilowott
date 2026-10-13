export type SyncStatus = 'not_synced' | 'synced' | 'modified' | 'error';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  woo_id?: number;
  products_count?: number;
}

export interface AttributeOption {
  id: number;
  attribute_id: number;
  value: string;
  label: string;
}

export interface Attribute {
  id: number;
  name: string;
  slug: string;
  type: string;
  is_variation: boolean;
  woo_id?: number;
  options?: AttributeOption[];
}

export interface ProductAttributeItem {
  id?: number;
  attribute_id: number;
  selected_values: string[];
  is_variation?: boolean;
  is_visible?: boolean;
  attribute?: Attribute;
}

export interface QualityIssue {
  field: string;
  severity: 'critical' | 'medium' | 'low';
  message: string;
  recommendation: string;
  deduction?: number;
}

export interface QualityCheckResult {
  code: string;
  name: string;
  passed: boolean;
  deduction: number;
  detail: string;
  suggested_fix?: string;
}

export interface QualityAssessment {
  score: number;
  rating: 'Excellent' | 'Good' | 'Needs Attention' | 'Poor';
  issues: QualityIssue[];
  checks: QualityCheckResult[];
  positive_points?: Array<{ name: string; points: number; detail: string }>;
  woo_ready: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: 'simple' | 'variable';
  status: 'draft' | 'publish';
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  manage_stock: boolean;
  description?: string;
  short_description?: string;
  image_url?: string;
  brand?: string;
  woo_id?: number | null;
  sync_status: SyncStatus;
  quality_score: number;
  quality_issues?: QualityIssue[];
  baseline_snapshot?: Record<string, any> | null;
  last_synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
  categories?: Category[];
  product_attributes?: ProductAttributeItem[];
}

export type ThreeWayStatus = 'MATCH' | 'PIM_CHANGED' | 'WOO_CHANGED' | 'CONFLICT' | 'NEW';

export interface DiffItem {
  field: string;
  label: string;
  baseline_value: string;
  pim_value: string;
  woo_value: string;
  is_different: boolean;
  diff_type: 'new' | 'modified' | 'unchanged' | 'conflict';
  three_way_status: ThreeWayStatus;
  policy_owner?: 'PIM' | 'WOOCOMMERCE';
  recommended_resolution?: 'keep_pim' | 'keep_woo' | 'manual';
  resolution_reason?: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface BlastRadiusImpact {
  risk_level: RiskLevel;
  risk_reason: string;
  affected_products_count: number;
  price_changes_count: number;
  stock_changes_count: number;
  category_changes_count: number;
  conflicts_count: number;
  recommended_action: string;
}

export interface PreFlightDiffResponse {
  product_id: number;
  product_name: string;
  sku: string;
  action: 'create' | 'update';
  woo_id?: number | null;
  is_ready: boolean;
  has_changes: boolean;
  has_conflicts: boolean;
  validation_errors: string[];
  validation_warnings: string[];
  diffs: DiffItem[];
  blast_radius: BlastRadiusImpact;
  recommended_action: 'keep_pim' | 'keep_woo' | 'manual';
  payload_preview: Record<string, unknown>;
  remote_state?: Record<string, unknown> | null;
  baseline_snapshot?: Record<string, unknown> | null;
}

export interface SyncLog {
  id: number;
  product_id?: number | null;
  product_name?: string | null;
  entity_type: string;
  direction: 'pim_to_woo' | 'woo_to_pim' | 'rollback';
  action: string;
  status: 'success' | 'failed' | 'warning';
  changed_fields?: string[];
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
  previous_snapshot?: Record<string, unknown> | null;
  changeset_id?: string | null;
  error_message?: string | null;
  created_at: string;
}

export type ChangesetStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'EXECUTION_FAILED';

export interface ChangesetFieldChange {
  productId: number;
  productName: string;
  field: string;
  previousValue: any;
  newValue: any;
  source: 'PIM' | 'WOOCOMMERCE' | 'AI';
  approved: boolean;
}

export interface SyncChangeset {
  id: string;
  createdAt: string;
  source: string;
  target: string;
  products: number[];
  fieldChanges: ChangesetFieldChange[];
  validationResults: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
  riskLevel: RiskLevel;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  executionStatus: ChangesetStatus;
  appliedAt?: string;
}

export interface MockStoreProduct {
  id: number;
  name: string;
  slug: string;
  sku?: string;
  type: string;
  status: string;
  price: string;
  regular_price: string;
  sale_price?: string;
  stock_quantity?: number;
  description?: string;
  short_description?: string;
  image_url?: string;
  brand?: string;
  categories?: Array<{ id: number; name: string; slug: string }>;
  attributes?: Array<{ name: string; options: string[] }>;
  updated_at?: string;
}
