import { Request, Response } from 'express';
import { AIAgentService } from '../services/ai/aiAgentService.js';
import { AIProviderFactory } from '../services/ai/aiProvider.js';
import { ProductRepository } from '../repositories/productRepository.js';
import { QualityScoreService } from '../services/qualityScoreService.js';
import { BULK_AUDIT_SYSTEM_PROMPT } from '../services/ai/promptTemplates.js';

export class AIController {
  public static async analyzeProduct(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    const product = ProductRepository.getById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const assessment = QualityScoreService.assess(product);
    res.json({
      success: true,
      data: {
        productId,
        productName: product.name,
        qualityScore: assessment.score,
        rating: assessment.rating,
        woo_ready: assessment.woo_ready,
        issues: assessment.issues,
        checks: assessment.checks,
      },
    });
  }

  public static async agentPlan(req: Request, res: Response): Promise<void> {
    const productId = Number(req.params.id);
    if (isNaN(productId)) {
      res.status(400).json({ success: false, message: 'Invalid product ID' });
      return;
    }

    try {
      const result = await AIAgentService.plan(productId);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async agentExecute(req: Request, res: Response): Promise<void> {
    const runId = Number(req.params.runId);
    const { decision, fieldOverrides } = req.body;

    if (isNaN(runId)) {
      res.status(400).json({ success: false, message: 'Invalid run ID' });
      return;
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      res.status(422).json({ success: false, message: 'decision must be "approved" or "rejected"' });
      return;
    }

    try {
      const result = await AIAgentService.executeApprovedPlan(runId, decision, fieldOverrides);
      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async auditCatalog(_req: Request, res: Response): Promise<void> {
    const products = ProductRepository.getAll();
    const assessments = products.map(p => ({
      product: p,
      assessment: QualityScoreService.assess(p),
    }));

    const totalScore = assessments.reduce((sum, a) => sum + a.assessment.score, 0);
    const avgScore = products.length > 0 ? Math.round(totalScore / products.length) : 0;
    const readyToSync = assessments.filter(a => a.assessment.woo_ready).length;
    const needsAttention = assessments.filter(a => a.assessment.score < 75).length;

    const allIssues = assessments.flatMap(a => a.assessment.issues);
    const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
    const contentCount = allIssues.filter(i => i.field === 'description' || i.field === 'short_description').length;
    const attributeCount = allIssues.filter(i => i.field === 'attributes' || i.field === 'brand').length;
    const pricingCount = allIssues.filter(i => i.field === 'regular_price' || i.field === 'sale_price').length;

    // Try LLM audit summary, fall back to deterministic
    let executiveSummary: string;
    let priorityRecommendations: any[];
    let aiProviderInfo: any;

    try {
      const provider = AIProviderFactory.getProvider();
      const catalogSummary = JSON.stringify({
        totalProducts: products.length,
        avgScore,
        readyToSync,
        needsAttention,
        criticalCount,
        productSummaries: assessments.map(a => ({
          name: a.product.name,
          sku: a.product.sku,
          score: a.assessment.score,
          issueCount: a.assessment.issues.length,
          criticalIssues: a.assessment.issues.filter(i => i.severity === 'critical').map(i => i.message),
        })),
      });

      const aiResult = await provider.generateStructuredCompletion<any>(
        BULK_AUDIT_SYSTEM_PROMPT,
        catalogSummary,
        ''
      );

      executiveSummary = aiResult.data.executiveSummary || `Catalog health at ${avgScore}/100. ${needsAttention} products require immediate attention.`;
      priorityRecommendations = aiResult.data.priorityRecommendations || [];
      aiProviderInfo = {
        provider: aiResult.providerName,
        model: aiResult.model,
        isFallback: aiResult.isFallback,
      };
    } catch {
      executiveSummary = `Catalog health score: ${avgScore}/100. ${products.length} total products analyzed. ${needsAttention} products need attention with ${criticalCount} critical issues requiring immediate resolution before WooCommerce synchronization.`;
      priorityRecommendations = [];
      if (criticalCount > 0) {
        priorityRecommendations.push({
          title: 'Resolve Critical Pricing & SKU Issues',
          impact: 'high',
          description: 'Products with pricing inversions or missing SKUs cannot be pushed to WooCommerce.',
          affectedProductsCount: assessments.filter(a => a.assessment.issues.some(i => i.severity === 'critical')).length,
        });
      }
      if (contentCount > 0) {
        priorityRecommendations.push({
          title: 'Enrich Product Descriptions',
          impact: 'medium',
          description: 'Missing or short descriptions reduce store conversion rates and SEO rankings.',
          affectedProductsCount: assessments.filter(a => a.assessment.issues.some(i => i.field === 'description')).length,
        });
      }
      if (attributeCount > 0) {
        priorityRecommendations.push({
          title: 'Add Product Attributes & Brand Data',
          impact: 'low',
          description: 'Products without filterable attributes have lower discoverability in WooCommerce stores.',
          affectedProductsCount: assessments.filter(a => a.assessment.issues.some(i => i.field === 'attributes')).length,
        });
      }
      aiProviderInfo = { provider: 'Deterministic Fallback', model: 'rule-based', isFallback: true };
    }

    res.json({
      success: true,
      data: {
        catalogHealth: avgScore,
        totalProducts: products.length,
        readyToSync,
        needsAttention,
        criticalIssuesCount: criticalCount,
        contentIssuesCount: contentCount,
        attributeIssuesCount: attributeCount,
        pricingIssuesCount: pricingCount,
        executiveSummary,
        priorityRecommendations,
        productBreakdown: assessments.map(a => ({
          id: a.product.id,
          name: a.product.name,
          sku: a.product.sku,
          score: a.assessment.score,
          rating: a.assessment.rating,
          woo_ready: a.assessment.woo_ready,
          issuesCount: a.assessment.issues.length,
          sync_status: a.product.sync_status,
        })),
        aiProviderInfo,
      },
    });
  }
}
