import {
  Category,
  Attribute,
  Product,
  PreFlightDiffResponse,
  SyncLog,
  DashboardStats,
  MockStoreProduct,
} from '../types';

const BASE_URL = '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok || data.success === false) {
    const errorMsg = data.message || `API request failed with status ${response.status}`;
    const err = new Error(errorMsg);
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
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.sync_status && params.sync_status !== 'all') query.set('sync_status', params.sync_status);
    if (params.category_id && params.category_id !== 'all') query.set('category_id', params.category_id);
    return request<{ success: boolean; data: Product[]; count: number }>(`/products?${query.toString()}`);
  },

  getProduct: (id: number) => request<{ success: boolean; data: Product }>(`/products/${id}`),

  createProduct: (payload: Partial<Product> & { category_ids?: number[]; attributes?: any[] }) =>
    request<{ success: boolean; message: string; data: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProduct: (id: number, payload: Partial<Product> & { category_ids?: number[]; attributes?: any[] }) =>
    request<{ success: boolean; message: string; data: Product }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteProduct: (id: number) =>
    request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),

  // Categories
  getCategories: () => request<{ success: boolean; data: Category[] }>('/categories'),
  createCategory: (payload: { name: string; slug?: string; description?: string }) =>
    request<{ success: boolean; data: Category }>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Attributes
  getAttributes: () => request<{ success: boolean; data: Attribute[] }>('/attributes'),
  createAttribute: (payload: { name: string; slug?: string; type?: string; options?: string[] }) =>
    request<{ success: boolean; data: Attribute }>('/attributes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addAttributeOption: (attributeId: number, payload: { value: string; label?: string }) =>
    request<{ success: boolean; data: Attribute }>(`/attributes/${attributeId}/options`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteAttribute: (id: number) =>
    request<{ success: boolean; message: string }>(`/attributes/${id}`, {
      method: 'DELETE',
    }),

  // Sync Operations
  getPreFlightDiff: (productId: number) =>
    request<{ success: boolean; data: PreFlightDiffResponse }>(`/sync/diff/${productId}`),

  pushProduct: (productId: number) =>
    request<{ success: boolean; message: string; woo_id: number; product: Product }>(`/sync/push/${productId}`, {
      method: 'POST',
    }),

  pushBatch: (productIds: number[]) =>
    request<{
      success: boolean;
      data: { total: number; synced: number; failed: number; details: any[] };
    }>('/sync/push-batch', {
      method: 'POST',
      body: JSON.stringify({ product_ids: productIds }),
    }),

  importProduct: (wooId: number) =>
    request<{ success: boolean; message: string; data: Product }>(`/sync/import/${wooId}`, {
      method: 'POST',
    }),

  importAll: () =>
    request<{ success: boolean; data: { total: number; imported: number; updated: number; message: string } }>(
      '/sync/import-all',
      { method: 'POST' }
    ),

  getSyncLogs: (params: { status?: string; direction?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.direction && params.direction !== 'all') query.set('direction', params.direction);
    return request<{ success: boolean; data: SyncLog[] }>(`/sync/logs?${query.toString()}`);
  },

  getMockStoreProducts: (search?: string) => {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ success: boolean; data: MockStoreProduct[]; count: number }>(`/sync/mock-store-products${query}`);
  },

  // Settings
  getSettings: () =>
    request<{
      success: boolean;
      data: {
        woo_active_driver: 'mock' | 'live';
        woo_store_url: string;
        woo_consumer_key: string;
        woo_consumer_secret: string;
        mock_woo_simulate_failure: boolean;
      };
    }>('/settings'),

  updateSettings: (payload: {
    woo_active_driver: string;
    woo_store_url?: string;
    woo_consumer_key?: string;
    woo_consumer_secret?: string;
    mock_woo_simulate_failure?: boolean;
  }) =>
    request<{ success: boolean; message: string }>('/settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  testConnection: () =>
    request<{
      success: boolean;
      data: {
        success: boolean;
        driver: string;
        message: string;
        store_name?: string;
        url?: string;
        wc_version?: string;
        products_count?: number;
      };
    }>('/settings/test-connection', { method: 'POST' }),

  resetMockStore: () =>
    request<{ success: boolean; message: string }>('/settings/reset-mock-store', { method: 'POST' }),
};
