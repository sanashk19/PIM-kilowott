import { Request, Response } from 'express';
import { ProductService } from '../services/productService.js';
import { QualityScoreService } from '../services/qualityScoreService.js';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  slug: z.string().optional(),
  type: z.enum(['simple', 'variable']).default('simple'),
  status: z.enum(['draft', 'publish']).default('publish'),
  regular_price: z.number().nullable().optional(),
  sale_price: z.number().nullable().optional(),
  stock_quantity: z.number().default(0),
  manage_stock: z.boolean().default(true),
  description: z.string().optional(),
  short_description: z.string().optional(),
  image_url: z.string().optional(),
  brand: z.string().optional(),
  category_ids: z.array(z.number()).optional(),
  attributes: z.array(z.object({
    attribute_id: z.number(),
    selected_values: z.array(z.string()),
  })).optional(),
});

export class ProductController {
  public static getAll(req: Request, res: Response): void {
    const search = req.query.search as string | undefined;
    const sync_status = req.query.sync_status as string | undefined;
    const category_id = req.query.category_id ? Number(req.query.category_id) : undefined;

    const products = ProductService.getAll({ search, sync_status, category_id });
    res.json({
      success: true,
      data: products,
      count: products.length,
    });
  }

  public static getById(req: Request, res: Response): void {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    const product = ProductService.getById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const qualityAssessment = QualityScoreService.assess(product);

    res.json({
      success: true,
      data: {
        ...product,
        quality_assessment: qualityAssessment,
      },
    });
  }

  public static create(req: Request, res: Response): void {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const product = ProductService.create(parsed.data);
      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to create product',
      });
    }
  }

  public static update(req: Request, res: Response): void {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    try {
      const updated = ProductService.update(id, req.body);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Product not found' });
        return;
      }

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to update product',
      });
    }
  }

  public static delete(req: Request, res: Response): void {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    const success = ProductService.delete(id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  }

  public static recalculateQuality(req: Request, res: Response): void {
    const count = ProductService.recalculateAllQualityScores();
    res.json({
      success: true,
      message: `Recalculated quality scores for ${count} products.`,
    });
  }
}
