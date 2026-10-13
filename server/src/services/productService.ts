import { ProductRepository } from '../repositories/productRepository.js';
import { QualityScoreService } from './qualityScoreService.js';
import { Product } from '../types/index.js';

export class ProductService {
  public static getAll(filters: { search?: string; sync_status?: string; category_id?: number } = {}): Product[] {
    return ProductRepository.getAll(filters);
  }

  public static getById(id: number): Product | null {
    return ProductRepository.getById(id);
  }

  public static create(
    payload: Partial<Product> & { category_ids?: number[]; attributes?: Array<{ attribute_id: number; selected_values: string[] }> }
  ): Product {
    // 1. Evaluate initial quality score
    const assessment = QualityScoreService.assess(payload);

    const productData: Partial<Product> = {
      ...payload,
      quality_score: assessment.score,
      quality_issues: assessment.issues,
      sync_status: 'not_synced',
    };

    return ProductRepository.create(productData, payload.category_ids, payload.attributes);
  }

  public static update(
    id: number,
    payload: Partial<Product> & { category_ids?: number[]; attributes?: Array<{ attribute_id: number; selected_values: string[] }> }
  ): Product | null {
    const existing = ProductRepository.getById(id);
    if (!existing) return null;

    // Merge existing with updates to assess new quality
    const merged: Partial<Product> = {
      ...existing,
      ...payload,
    };

    const assessment = QualityScoreService.assess(merged);

    // If product was synced and data changed, mark as modified
    let sync_status = payload.sync_status || existing.sync_status;
    if (existing.sync_status === 'synced' && !payload.sync_status) {
      sync_status = 'modified';
    }

    const updated = ProductRepository.update(
      id,
      {
        ...payload,
        sync_status,
        quality_score: assessment.score,
        quality_issues: assessment.issues,
      },
      payload.category_ids,
      payload.attributes
    );

    return updated;
  }

  public static recalculateAllQualityScores(): number {
    const products = ProductRepository.getAll();
    let updatedCount = 0;

    for (const p of products) {
      const assessment = QualityScoreService.assess(p);
      ProductRepository.update(p.id, {
        quality_score: assessment.score,
        quality_issues: assessment.issues,
      });
      updatedCount++;
    }

    return updatedCount;
  }

  public static delete(id: number): boolean {
    return ProductRepository.delete(id);
  }
}
