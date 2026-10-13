export interface WooProductPayload {
  name: string;
  slug?: string;
  type?: string;
  status?: string;
  regular_price?: string;
  sale_price?: string;
  description?: string;
  short_description?: string;
  sku?: string;
  manage_stock?: boolean;
  stock_quantity?: number;
  images?: Array<{ src: string }>;
  categories?: Array<{ id?: number; name?: string; slug?: string }>;
  attributes?: Array<{ name: string; options: string[]; visible?: boolean; variation?: boolean }>;
}

export interface WooProductResponse {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: string;
  price: string;
  regular_price: string;
  sale_price: string;
  sku: string;
  stock_quantity: number | null;
  description: string;
  short_description: string;
  images: Array<{ id: number; src: string }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  attributes: Array<{ name: string; options: string[] }>;
  date_created?: string;
  date_modified?: string;
}

export interface WooCommerceClient {
  getProducts(params?: { search?: string; per_page?: number }): Promise<WooProductResponse[]>;
  getProduct(id: number): Promise<WooProductResponse | null>;
  createProduct(payload: WooProductPayload): Promise<WooProductResponse>;
  updateProduct(id: number, payload: Partial<WooProductPayload>): Promise<WooProductResponse>;
  deleteProduct(id: number): Promise<{ id: number; message: string }>;
  testConnection(): Promise<{ success: boolean; message: string; store_name?: string; products_count?: number }>;
}
