import { Request, Response } from 'express';
import { CategoryRepository } from '../repositories/categoryRepository.js';

export class CategoryController {
  public static getAll(req: Request, res: Response): void {
    const categories = CategoryRepository.getAll();
    res.json({
      success: true,
      data: categories,
    });
  }

  public static create(req: Request, res: Response): void {
    const { name, slug, description, woo_id } = req.body;
    if (!name) {
      res.status(422).json({ success: false, message: 'Category name is required' });
      return;
    }

    try {
      const category = CategoryRepository.create({ name, slug, description, woo_id });
      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
