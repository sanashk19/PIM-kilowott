import { getDb } from '../../db/connection.js';
import { ProductRepository } from '../../repositories/productRepository.js';
import { QualityScoreService } from '../qualityScoreService.js';
import { AIProviderFactory } from './aiProvider.js';
import {
  PRODUCT_AGENT_SYSTEM_PROMPT,
  STRUCTURED_AGENT_SCHEMA_INSTRUCTION,
} from './promptTemplates.js';
import {
  inspectProductTool,
  calculateQualityScoreTool,
  getProductAttributesTool,
  checkWooCommerceStateTool,
  detectConflictsTool,
  prepareSyncPlanTool,
  validateProductTool,
  executeApprovedSyncTool,
  writeAuditLogTool,
} from './tools/index.js';

export interface AgentStepTrace {
  step: number;
  tool: string;
  description: string;
  status: 'completed' | 'failed' | 'waiting_for_approval';
  details?: any;
  timestamp: string;
}

export class AIAgentService {
  public static async plan(productId: number): Promise<any> {
    const steps: AgentStepTrace[] = [];

    // Step 1: Inspect Product
    const { product } = await inspectProductTool.execute({ productId });
    steps.push({
      step: 1,
      tool: inspectProductTool.name,
      description: inspectProductTool.description,
      status: 'completed',
      details: { id: product.id, name: product.name, sku: product.sku },
      timestamp: new Date().toISOString(),
    });

    // Step 2: Calculate Quality Score
    const { assessment } = await calculateQualityScoreTool.execute({ product });
    steps.push({
      step: 2,
      tool: calculateQualityScoreTool.name,
      description: calculateQualityScoreTool.description,
      status: 'completed',
      details: { score: assessment.score, rating: assessment.rating, issuesCount: assessment.issues.length },
      timestamp: new Date().toISOString(),
    });

    // Step 3: Get Attributes
    const { attributes } = await getProductAttributesTool.execute({ productId });
    steps.push({
      step: 3,
      tool: getProductAttributesTool.name,
      description: getProductAttributesTool.description,
      status: 'completed',
      details: { count: attributes.length },
      timestamp: new Date().toISOString(),
    });

    // Step 4: Check WooCommerce State
    const { remoteState, exists } = await checkWooCommerceStateTool.execute({ wooId: product.woo_id || null });
    steps.push({
      step: 4,
      tool: checkWooCommerceStateTool.name,
      description: checkWooCommerceStateTool.description,
      status: 'completed',
      details: { remoteExists: exists, remoteId: product.woo_id },
      timestamp: new Date().toISOString(),
    });

    // Step 5: Detect Conflicts
    const { hasConflicts, diffs } = await detectConflictsTool.execute({ productId });
    steps.push({
      step: 5,
      tool: detectConflictsTool.name,
      description: detectConflictsTool.description,
      status: 'completed',
      details: { hasConflicts, diffCount: diffs.length },
      timestamp: new Date().toISOString(),
    });

    // Step 6: Invoke LLM / AI Provider for Structured Recommendations
    const aiProvider = AIProviderFactory.getProvider();
    const userPrompt = JSON.stringify({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        regular_price: product.regular_price,
        sale_price: product.sale_price,
        stock_quantity: product.stock_quantity,
        description: product.description,
        short_description: product.short_description,
        image_url: product.image_url,
        brand: product.brand,
        categories: product.categories,
        quality_score: assessment.score,
        issues: assessment.issues,
        remote_woo_exists: exists,
        remote_state: remoteState,
      },
    });

    const aiResult = await aiProvider.generateStructuredCompletion<any>(
      PRODUCT_AGENT_SYSTEM_PROMPT,
      userPrompt,
      STRUCTURED_AGENT_SCHEMA_INSTRUCTION
    );

    // Step 7: Prepare Sync Plan
    const { plan: syncPlan } = await prepareSyncPlanTool.execute({
      product,
      issues: aiResult.data.issues || assessment.issues,
      proposedChanges: aiResult.data.proposedChanges || [],
    });

    steps.push({
      step: 6,
      tool: prepareSyncPlanTool.name,
      description: prepareSyncPlanTool.description,
      status: 'waiting_for_approval',
      details: syncPlan,
      timestamp: new Date().toISOString(),
    });

    // Step 8: Persist to ai_agent_runs table
    const db = getDb();
    const runInfo = db.prepare(`
      INSERT INTO ai_agent_runs (
        product_id, status, analysis_summary, proposed_patch, sync_plan, user_decision
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      productId,
      'pending_approval',
      aiResult.data.reasoningSummary || 'AI analysis completed.',
      JSON.stringify(aiResult.data.proposedChanges || []),
      JSON.stringify(syncPlan),
      'pending'
    );

    const runId = Number(runInfo.lastInsertRowid);

    return {
      runId,
      productId,
      productName: product.name,
      status: 'pending_approval',
      qualityScore: assessment.score,
      rating: assessment.rating,
      reasoningSummary: aiResult.data.reasoningSummary,
      issues: aiResult.data.issues || assessment.issues,
      proposedChanges: aiResult.data.proposedChanges || [],
      syncPlan,
      steps,
      aiProviderInfo: {
        provider: aiResult.providerName,
        model: aiResult.model,
        isFallback: aiResult.isFallback,
      },
    };
  }

  public static async executeApprovedPlan(
    runId: number,
    decision: 'approved' | 'rejected',
    customFieldOverrides?: Record<string, any>
  ): Promise<any> {
    const db = getDb();
    const runRow = db.prepare('SELECT * FROM ai_agent_runs WHERE id = ?').get(runId) as any;
    if (!runRow) {
      throw new Error(`AI Agent Run #${runId} not found.`);
    }

    if (runRow.status !== 'pending_approval') {
      throw new Error(`AI Agent Run #${runId} has already been processed (Status: ${runRow.status}).`);
    }

    if (decision === 'rejected') {
      db.prepare("UPDATE ai_agent_runs SET status = 'rejected', user_decision = 'rejected' WHERE id = ?").run(runId);
      return {
        runId,
        status: 'rejected',
        message: 'AI recommendations rejected by user. No modifications applied.',
      };
    }

    // Process Approved Changes:
    const proposedChanges: Array<{ field: string; after: any }> = JSON.parse(runRow.proposed_patch || '[]');
    const patchPayload: Record<string, any> = {};

    for (const change of proposedChanges) {
      if (change.field === 'category_ids') {
        patchPayload.category_ids = change.after;
      } else {
        patchPayload[change.field] = change.after;
      }
    }

    // Apply any manual user overrides
    if (customFieldOverrides) {
      Object.assign(patchPayload, customFieldOverrides);
    }

    // 1. Apply to PIM DB
    const updatedProduct = ProductRepository.update(runRow.product_id, patchPayload);
    if (!updatedProduct) {
      throw new Error(`Failed to apply changes to Product #${runRow.product_id}`);
    }

    // 2. Validate product
    const { valid, errors } = await validateProductTool.execute({ product: updatedProduct });
    if (!valid) {
      throw new Error(`Post-patch validation failed: ${errors.join(', ')}`);
    }

    // 3. Recalculate Quality Score
    const newAssessment = QualityScoreService.assess(updatedProduct);
    ProductRepository.update(runRow.product_id, {
      quality_score: newAssessment.score,
      quality_issues: newAssessment.issues,
    });

    // 4. Push to WooCommerce
    const syncResult = await executeApprovedSyncTool.execute({ productId: runRow.product_id });

    // 5. Write Audit Log
    const changedFields = Object.keys(patchPayload);
    await writeAuditLogTool.execute({
      productId: updatedProduct.id,
      productName: updatedProduct.name,
      action: 'ai_agent_approved_sync',
      status: 'success',
      changedFields,
      payload: {
        runId,
        appliedChanges: patchPayload,
        wooId: syncResult.woo_id,
        newQualityScore: newAssessment.score,
      },
    });

    // 6. Update ai_agent_runs record
    db.prepare(`
      UPDATE ai_agent_runs SET
        status = 'applied',
        user_decision = 'approved',
        applied_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(runId);

    const refreshedProduct = ProductRepository.getById(runRow.product_id)!;

    return {
      runId,
      status: 'applied',
      userDecision: 'approved',
      message: `AI-recommended improvements successfully approved, validated, and pushed to WooCommerce (ID: ${syncResult.woo_id})!`,
      newQualityScore: newAssessment.score,
      product: refreshedProduct,
      woo_id: syncResult.woo_id,
    };
  }
}
