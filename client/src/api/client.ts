import type {
  Category, Attribute, Product, PreFlightDiffResponse,
  SyncLog, DashboardStats, MockStoreProduct,
  AgentPlanResult, CatalogAuditResult,
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();
  if (!response.ok || data.success === false) {
    const err = new Error(data.message || `API request failed (${response.status})`);
    (err as any).data = data;
    throw err;
  }
  return data;
}

export const api = {
  // Dashboard
  getStats: () => request<{ success: boolean; data: DashboardStats }>('/dashboard/stats'),

  // Products
  getProducts: (params: { search?: string; sync_status?: string; category_id?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set('search', params.search);
    if (params.sync_status && params.sync_status !== 'all') q.set('sync_status', params.sync_status);
    if (params.category_id && params.category_id !== 'all') q.set('category_id', params.category_id);
    return request<{ success: boolean; data: Product[]; count: number }>(`/products?${q.toString()}`);
  },
  getProduct: (id: number) => request<{ success: boolean; data: Product }>(`/products/${id}`),
  createProduct: (payload: any) => request<{ success: boolean; message: string; data: Product }>('/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id: number, payload: any) => request<{ success: boolean; message: string; data: Product }>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id: number) => request<{ success: boolean; message: string }>(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request<{ success: boolean; data: Category[] }>('/categories'),
  createCategory: (payload: { name: string; slug?: string; description?: string }) =>
    request<{ success: boolean; data: Category }>('/categories', { method: 'POST', body: JSON.stringify(payload) }),

  // Attributes
  getAttributes: () => request<{ success: boolean; data: Attribute[] }>('/attributes'),
  createAttribute: (payload: any) => request<{ success: boolean; data: Attribute }>('/attributes', { method: 'POST', body: JSON.stringify(payload) }),
  addAttributeOption: (id: number, payload: { value: string; label?: string }) =>
    request<{ success: boolean; data: Attribute }>(`/attributes/${id}/options`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteAttribute: (id: number) => request<{ success: boolean }>(`/attributes/${id}`, { method: 'DELETE' }),

  // Sync
  getPreFlightDiff: (productId: number) => request<{ success: boolean; data: PreFlightDiffResponse }>(`/sync/diff/${productId}`),
  pushProduct: (productId: number) => request<{ success: boolean; message: string; woo_id: number; product: Product }>(`/sync/push/${productId}`, { method: 'POST' }),
  pushBatch: (productIds: number[]) => request<{ success: boolean; data: any }>('/sync/push-batch', { method: 'POST', body: JSON.stringify({ product_ids: productIds }) }),
  importProduct: (wooId: number) => request<{ success: boolean; message: string; data: Product }>(`/sync/import/${wooId}`, { method: 'POST' }),
  importAll: () => request<{ success: boolean; data: any }>('/sync/import-all', { method: 'POST' }),
  resolveConflict: (productId: number, resolution: 'keep_pim' | 'keep_woo') =>
    request<{ success: boolean; message: string; product: Product }>('/sync/resolve-conflict', { method: 'POST', body: JSON.stringify({ product_id: productId, resolution }) }),
  getSyncLogs: (params: { status?: string; direction?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.status && params.status !== 'all') q.set('status', params.status);
    if (params.direction && params.direction !== 'all') q.set('direction', params.direction);
    return request<{ success: boolean; data: SyncLog[] }>(`/sync/logs?${q.toString()}`);
  },
  getMockStoreProducts: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; data: MockStoreProduct[]; count: number }>(`/sync/mock-store-products${q}`);
  },

  // AI
  analyzeProduct: (productId: number) => request<{ success: boolean; data: any }>(`/ai/analyze-product/${productId}`, { method: 'POST' }),
  agentPlan: (productId: number) => request<{ success: boolean; data: AgentPlanResult }>(`/ai/agent/plan/${productId}`, { method: 'POST' }),
  agentExecute: (runId: number, decision: 'approved' | 'rejected', fieldOverrides?: any) =>
    request<{ success: boolean; data: any }>(`/ai/agent/execute/${runId}`, { method: 'POST', body: JSON.stringify({ decision, fieldOverrides }) }),
  auditCatalog: () => request<{ success: boolean; data: CatalogAuditResult }>('/ai/audit-catalog', { method: 'POST' }),

  // Settings
  getSettings: () => request<{ success: boolean; data: any }>('/settings'),
  updateSettings: (payload: any) => request<{ success: boolean; message: string }>('/settings', { method: 'POST', body: JSON.stringify(payload) }),
  testConnection: () => request<{ success: boolean; data: any }>('/settings/test-connection', { method: 'POST' }),
  resetMockStore: () => request<{ success: boolean; message: string }>('/settings/reset-mock-store', { method: 'POST' }),
};
