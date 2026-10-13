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
  options: AttributeOption[];
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
}

export interface QualityCheck {
  code: string;
  name: string;
  passed: boolean;
  deduction: number;
  detail: string;
}

export interface QualityAssessment {
  score: number;
  rating: 'Excellent' | 'Good' | 'Needs Attention' | 'Poor';
  issues: QualityIssue[];
  checks: QualityCheck[];
  woo_ready: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  type: 'simple' | 'variable';
  status: 'draft' | 'publish';
  price?: number | string;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number;
  manage_stock: boolean;
  description?: string;
  short_description?: string;
  image_url?: string;
  images?: Array<{ id?: number; src: string }>;
  brand?: string;
  category?: Category;
  woo_id?: number | null;
  sync_status: SyncStatus;
  quality_score: number;
  quality_issues?: QualityIssue[];
  quality_assessment?: QualityAssessment;
  last_synced_at?: string | null;
  created_at?: string;
  updated_at?: string;
  categories?: Category[];
  product_attributes?: ProductAttributeItem[];
}

export interface DiffItem {
  field: string;
  label?: string;
  field_label?: string;
  pim_value: any;
  woo_value: any;
  is_different: boolean;
  diff_type: 'new' | 'modified' | 'unchanged' | 'conflict';
  status?: 'match' | 'changed' | 'conflict';
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
  payload_preview: Record<string, unknown>;
  remote_state?: Record<string, unknown> | null;
}

export interface SyncLog {
  id: number;
  product_id?: number | null;
  product_name?: string | null;
  product?: { name: string; sku?: string } | null;
  entity_type: string;
  direction: 'pim_to_woo' | 'woo_to_pim';
  action: string;
  status: 'success' | 'failed' | 'warning';
  changed_fields?: string[];
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
  error_message?: string | null;
  created_at: string;
}

export interface DashboardStats {
  counts: {
    total: number;
    synced: number;
    modified: number;
    error: number;
    not_synced: number;
    mock_store: number;
    needs_attention: number;
  };
  sync_health_percentage: number;
  avg_quality_score: number;
  driver: 'mock' | 'live';
  simulate_failure: boolean;
  recent_logs: SyncLog[];
  recent_products: Product[];
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
  images?: Array<{ id?: number; src: string }>;
  categories?: Array<{ id: number; name: string; slug: string }>;
  attributes?: Array<{ name: string; options: string[] }>;
  updated_at?: string;
}

export interface AgentStepTrace {
  step: number;
  tool: string;
  description: string;
  status: 'completed' | 'failed' | 'waiting_for_approval';
  details?: any;
  timestamp: string;
}

export interface AgentProposedChange {
  field: string;
  before: any;
  after: any;
  rationale: string;
}

export interface AgentPlanResult {
  runId: number;
  productId: number;
  productName: string;
  status: 'pending_approval' | 'applied' | 'rejected';
  qualityScore: number;
  rating: string;
  reasoningSummary: string;
  issues: QualityIssue[];
  proposedChanges: AgentProposedChange[];
  recommendations?: Array<{ field: string; reason: string }>;
  syncPlan: any;
  steps: AgentStepTrace[];
  aiProviderInfo: {
    provider: string;
    model: string;
    isFallback: boolean;
  };
}

export interface CatalogAuditResult {
  catalogHealth: number;
  totalProducts: number;
  analyzed?: number;
  readyToSync: number;
  needsAttention: number;
  criticalIssuesCount: number;
  contentIssuesCount: number;
  attributeIssuesCount: number;
  pricingIssuesCount: number;
  executiveSummary: string;
  priorityRecommendations: Array<{
    title: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    affectedProductsCount: number;
  }>;
  productBreakdown: Array<{
    id: number;
    name: string;
    sku: string;
    score: number;
    rating: string;
    woo_ready: boolean;
    issuesCount: number;
    sync_status: SyncStatus;
  }>;
  aiProviderInfo: {
    provider: string;
    model: string;
    isFallback: boolean;
  };
}
