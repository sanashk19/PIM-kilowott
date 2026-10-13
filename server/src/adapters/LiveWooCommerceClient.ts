import axios, { AxiosInstance } from 'axios';
import { WooCommerceClient, WooProductPayload, WooProductResponse } from './WooCommerceClient.js';

export class LiveWooCommerceClient implements WooCommerceClient {
  private client: AxiosInstance;

  constructor(storeUrl: string, consumerKey: string, consumerSecret: string) {
    const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    this.client = axios.create({
      baseURL: `${storeUrl.replace(/\/+$/, '')}/wp-json/wc/v3`,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });
  }

  public async getProducts(params?: { search?: string; per_page?: number }): Promise<WooProductResponse[]> {
    const res = await this.client.get('/products', { params });
    return res.data;
  }

  public async getProduct(id: number): Promise<WooProductResponse | null> {
    try {
      const res = await this.client.get(`/products/${id}`);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 404) return null;
      throw err;
    }
  }

  public async createProduct(payload: WooProductPayload): Promise<WooProductResponse> {
    const res = await this.client.post('/products', payload);
    return res.data;
  }

  public async updateProduct(id: number, payload: Partial<WooProductPayload>): Promise<WooProductResponse> {
    const res = await this.client.put(`/products/${id}`, payload);
    return res.data;
  }

  public async deleteProduct(id: number): Promise<{ id: number; message: string }> {
    const res = await this.client.delete(`/products/${id}`, { params: { force: true } });
    return { id: res.data.id, message: 'Permanently deleted live WooCommerce product.' };
  }

  public async testConnection(): Promise<{ success: boolean; message: string; store_name?: string; products_count?: number }> {
    try {
      const res = await this.client.get('/system_status');
      return {
        success: true,
        message: 'Successfully connected to Live WooCommerce REST API',
        store_name: res.data.environment?.site_title || 'Live WooCommerce Store',
      };
    } catch {
      // Fallback check to /products?per_page=1
      const res = await this.client.get('/products', { params: { per_page: 1 } });
      return {
        success: true,
        message: 'Successfully connected to Live WooCommerce REST API',
        products_count: res.data.length,
      };
    }
  }
}
