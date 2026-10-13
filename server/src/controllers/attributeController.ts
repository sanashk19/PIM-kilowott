import { Request, Response } from 'express';
import { AttributeRepository } from '../repositories/attributeRepository.js';

export class AttributeController {
  public static getAll(req: Request, res: Response): void {
    const attributes = AttributeRepository.getAll();
    res.json({
      success: true,
      data: attributes,
    });
  }

  public static create(req: Request, res: Response): void {
    const { name, slug, type, is_variation, options } = req.body;
    if (!name) {
      res.status(422).json({ success: false, message: 'Attribute name is required' });
      return;
    }

    try {
      const attribute = AttributeRepository.create({ name, slug, type, is_variation, options });
      res.status(201).json({
        success: true,
        data: attribute,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static addOption(req: Request, res: Response): void {
    const attributeId = Number(req.params.id);
    const { value, label } = req.body;
    if (!value) {
      res.status(422).json({ success: false, message: 'Option value is required' });
      return;
    }

    try {
      const opt = AttributeRepository.addOption(attributeId, value, label);
      const updated = AttributeRepository.getById(attributeId);
      res.status(201).json({
        success: true,
        data: updated,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static delete(req: Request, res: Response): void {
    const id = Number(req.params.id);
    const success = AttributeRepository.delete(id);
    if (!success) {
      res.status(404).json({ success: false, message: 'Attribute not found' });
      return;
    }
    res.json({ success: true, message: 'Attribute deleted successfully' });
  }
}
