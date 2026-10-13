import { Product, QualityAssessment, QualityCheckResult, QualityIssue } from '../types/index.js';

export class QualityScoreService {
  public static assess(product: Partial<Product>): QualityAssessment {
    const checks: QualityCheckResult[] = [];
    const issues: QualityIssue[] = [];
    let score = 100;

    // 1. SKU Completeness
    if (!product.sku || product.sku.trim() === '') {
      score -= 25;
      checks.push({
        code: 'SKU_VALID',
        name: 'SKU Identifier',
        passed: false,
        deduction: 25,
        detail: 'Product is missing a unique SKU identifier required for WooCommerce synchronization.',
      });
      issues.push({
        field: 'sku',
        severity: 'critical',
        message: 'Missing SKU identifier',
        recommendation: 'Generate an enterprise SKU conforming to naming conventions (e.g., CAT-BRAND-001).',
      });
    } else if (product.sku.trim().length < 3) {
      score -= 10;
      checks.push({
        code: 'SKU_VALID',
        name: 'SKU Identifier',
        passed: false,
        deduction: 10,
        detail: `SKU '${product.sku}' is too short (min 3 characters).`,
      });
      issues.push({
        field: 'sku',
        severity: 'medium',
        message: 'SKU is unusually short',
        recommendation: 'Use a structured SKU format containing brand and category codes.',
      });
    } else {
      checks.push({
        code: 'SKU_VALID',
        name: 'SKU Identifier',
        passed: true,
        deduction: 0,
        detail: `Valid SKU: ${product.sku}`,
      });
    }

    // 2. Product Name
    if (!product.name || product.name.trim() === '') {
      score -= 25;
      checks.push({
        code: 'NAME_VALID',
        name: 'Product Title',
        passed: false,
        deduction: 25,
        detail: 'Product title is empty.',
      });
      issues.push({
        field: 'name',
        severity: 'critical',
        message: 'Product title is missing',
        recommendation: 'Provide a clear, descriptive title including brand and primary feature.',
      });
    } else if (product.name.trim().length < 5) {
      score -= 10;
      checks.push({
        code: 'NAME_VALID',
        name: 'Product Title',
        passed: false,
        deduction: 10,
        detail: 'Title is too concise for SEO and discovery.',
      });
      issues.push({
        field: 'name',
        severity: 'medium',
        message: 'Product title is too brief',
        recommendation: 'Expand product title with defining product attributes.',
      });
    } else {
      checks.push({
        code: 'NAME_VALID',
        name: 'Product Title',
        passed: true,
        deduction: 0,
        detail: `Descriptive title: "${product.name}"`,
      });
    }

    // 3. Pricing Validity
    const regularPrice = product.regular_price !== undefined && product.regular_price !== null ? Number(product.regular_price) : null;
    const salePrice = product.sale_price !== undefined && product.sale_price !== null && product.sale_price !== ('' as any) ? Number(product.sale_price) : null;

    if (regularPrice === null || isNaN(regularPrice) || regularPrice <= 0) {
      score -= 20;
      checks.push({
        code: 'PRICE_VALID',
        name: 'Regular Price Validity',
        passed: false,
        deduction: 20,
        detail: 'Regular price is missing, zero, or invalid.',
      });
      issues.push({
        field: 'regular_price',
        severity: 'critical',
        message: 'Invalid regular price',
        recommendation: 'Set a valid positive numerical regular price before synchronizing to WooCommerce.',
      });
    } else if (salePrice !== null && !isNaN(salePrice) && salePrice >= regularPrice) {
      score -= 15;
      checks.push({
        code: 'PRICE_VALID',
        name: 'Price Coherence',
        passed: false,
        deduction: 15,
        detail: `Sale price (${salePrice}) cannot be equal to or higher than regular price (${regularPrice}).`,
      });
      issues.push({
        field: 'sale_price',
        severity: 'critical',
        message: 'Sale price exceeds or equals regular price',
        recommendation: `Adjust sale price below regular price (${regularPrice}) or remove discounted sale price.`,
      });
    } else {
      checks.push({
        code: 'PRICE_VALID',
        name: 'Pricing Validity',
        passed: true,
        deduction: 0,
        detail: salePrice !== null ? `Regular: ₹${regularPrice}, Sale: ₹${salePrice}` : `Regular: ₹${regularPrice}`,
      });
    }

    // 4. Description & Content
    const desc = product.description ? product.description.trim() : '';
    const shortDesc = product.short_description ? product.short_description.trim() : '';

    if (!desc) {
      score -= 15;
      checks.push({
        code: 'DESC_QUALITY',
        name: 'Detailed Description',
        passed: false,
        deduction: 15,
        detail: 'Full product description is missing.',
      });
      issues.push({
        field: 'description',
        severity: 'medium',
        message: 'Missing product description',
        recommendation: 'Generate an engaging WooCommerce-ready HTML product description.',
      });
    } else if (desc.length < 120) {
      score -= 8;
      checks.push({
        code: 'DESC_QUALITY',
        name: 'Description Depth',
        passed: false,
        deduction: 8,
        detail: `Description is very short (${desc.length} chars). May reduce conversion.`,
      });
      issues.push({
        field: 'description',
        severity: 'low',
        message: 'Product description is brief',
        recommendation: 'Enrich product description with key specifications and bullet points.',
      });
    } else {
      checks.push({
        code: 'DESC_QUALITY',
        name: 'Detailed Description',
        passed: true,
        deduction: 0,
        detail: `Comprehensive description present (${desc.length} characters).`,
      });
    }

    if (!shortDesc) {
      score -= 5;
      checks.push({
        code: 'SHORT_DESC_QUALITY',
        name: 'Short Summary Description',
        passed: false,
        deduction: 5,
        detail: 'Short description for catalog cards and quick-view is missing.',
      });
      issues.push({
        field: 'short_description',
        severity: 'low',
        message: 'Missing short summary description',
        recommendation: 'Add a 1-2 sentence compelling summary for search result snippets.',
      });
    } else {
      checks.push({
        code: 'SHORT_DESC_QUALITY',
        name: 'Short Summary Description',
        passed: true,
        deduction: 0,
        detail: 'Short summary present.',
      });
    }

    // 5. Media & Imagery
    if (!product.image_url || product.image_url.trim() === '') {
      score -= 15;
      checks.push({
        code: 'IMAGE_VALID',
        name: 'Product Media',
        passed: false,
        deduction: 15,
        detail: 'No primary product image assigned.',
      });
      issues.push({
        field: 'image_url',
        severity: 'medium',
        message: 'Missing primary product image',
        recommendation: 'Attach a high-resolution primary product image URL.',
      });
    } else {
      checks.push({
        code: 'IMAGE_VALID',
        name: 'Product Media',
        passed: true,
        deduction: 0,
        detail: 'Primary image URL configured.',
      });
    }

    // 6. Category Mapping
    const categoriesCount = (product.categories && product.categories.length > 0)
      ? product.categories.length
      : ((product as any).category_ids ? (product as any).category_ids.length : 0);

    if (categoriesCount === 0) {
      score -= 10;
      checks.push({
        code: 'CATEGORY_MAPPED',
        name: 'Category Classification',
        passed: false,
        deduction: 10,
        detail: 'Product is not mapped to any store category.',
      });
      issues.push({
        field: 'categories',
        severity: 'medium',
        message: 'Uncategorized product',
        recommendation: 'Assign the product to relevant category taxonomy for store navigation.',
      });
    } else {
      checks.push({
        code: 'CATEGORY_MAPPED',
        name: 'Category Classification',
        passed: true,
        deduction: 0,
        detail: `Mapped to ${categoriesCount} category/categories.`,
      });
    }

    // 7. Brand Specification
    if (!product.brand || product.brand.trim() === '') {
      score -= 5;
      checks.push({
        code: 'BRAND_PRESENT',
        name: 'Brand Attribution',
        passed: false,
        deduction: 5,
        detail: 'Brand attribution is unassigned.',
      });
      issues.push({
        field: 'brand',
        severity: 'low',
        message: 'Missing brand specification',
        recommendation: 'Specify the manufacturer or brand name.',
      });
    } else {
      checks.push({
        code: 'BRAND_PRESENT',
        name: 'Brand Attribution',
        passed: true,
        deduction: 0,
        detail: `Brand: ${product.brand}`,
      });
    }

    // 8. Attributes
    const attributesCount = (product.product_attributes && product.product_attributes.length > 0)
      ? product.product_attributes.length
      : ((product as any).attributes ? (product as any).attributes.length : 0);

    if (attributesCount === 0) {
      score -= 5;
      checks.push({
        code: 'ATTRIBUTES_PRESENT',
        name: 'Technical Attributes',
        passed: false,
        deduction: 5,
        detail: 'No product attributes (Color, Size, Material, etc.) attached.',
      });
      issues.push({
        field: 'attributes',
        severity: 'low',
        message: 'No product attributes specified',
        recommendation: 'Enrich product with specification attributes for filtering in WooCommerce.',
      });
    } else {
      checks.push({
        code: 'ATTRIBUTES_PRESENT',
        name: 'Technical Attributes',
        passed: true,
        deduction: 0,
        detail: `${attributesCount} attribute(s) configured.`,
      });
    }

    // 9. Stock Validity
    if (product.stock_quantity !== undefined && product.stock_quantity < 0) {
      score -= 10;
      checks.push({
        code: 'STOCK_VALID',
        name: 'Stock Inventory',
        passed: false,
        deduction: 10,
        detail: 'Stock quantity cannot be negative.',
      });
      issues.push({
        field: 'stock_quantity',
        severity: 'medium',
        message: 'Negative stock quantity',
        recommendation: 'Correct stock inventory level to zero or positive integer.',
      });
    } else {
      checks.push({
        code: 'STOCK_VALID',
        name: 'Stock Inventory',
        passed: true,
        deduction: 0,
        detail: `Stock level: ${product.stock_quantity ?? 0} units`,
      });
    }

    // Clamp score
    const finalScore = Math.max(0, Math.min(100, score));

    let rating: QualityAssessment['rating'] = 'Poor';
    if (finalScore >= 90) rating = 'Excellent';
    else if (finalScore >= 75) rating = 'Good';
    else if (finalScore >= 50) rating = 'Needs Attention';

    const hasCriticalIssues = issues.some(issue => issue.severity === 'critical');
    const woo_ready = finalScore >= 70 && !hasCriticalIssues;

    return {
      score: finalScore,
      rating,
      issues,
      checks,
      woo_ready,
    };
  }
}
