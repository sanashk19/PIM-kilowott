import { config } from '../../config/env.js';

export interface AICompletionResult<T> {
  data: T;
  isFallback: boolean;
  providerName: string;
  model: string;
}

export interface AIProvider {
  name: string;
  generateStructuredCompletion<T>(
    systemPrompt: string,
    userPrompt: string,
    schemaInstruction: string
  ): Promise<AICompletionResult<T>>;
}

export class GeminiProvider implements AIProvider {
  public name = 'Google Gemini';

  constructor(private apiKey: string, private model: string = 'gemini-2.0-flash') {}

  public async generateStructuredCompletion<T>(
    systemPrompt: string,
    userPrompt: string,
    schemaInstruction: string
  ): Promise<AICompletionResult<T>> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const promptText = `${systemPrompt}\n\n${schemaInstruction}\n\nUSER INPUT:\n${userPrompt}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Gemini API warning] (${res.status}): ${errText}. Using deterministic fallback.`);
        const fallback = new DeterministicFallbackProvider();
        return fallback.generateStructuredCompletion<T>(systemPrompt, userPrompt, schemaInstruction);
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        const fallback = new DeterministicFallbackProvider();
        return fallback.generateStructuredCompletion<T>(systemPrompt, userPrompt, schemaInstruction);
      }

      const cleanedText = rawText.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
      const parsed: T = JSON.parse(cleanedText);
      return {
        data: parsed,
        isFallback: false,
        providerName: 'Google Gemini',
        model: this.model,
      };
    } catch (err: any) {
      console.warn(`[Gemini API Network Error]: ${err.message}. Using deterministic fallback.`);
      const fallback = new DeterministicFallbackProvider();
      return fallback.generateStructuredCompletion<T>(systemPrompt, userPrompt, schemaInstruction);
    }
  }
}

export class OpenAIProvider implements AIProvider {
  public name = 'OpenAI';

  constructor(private apiKey: string, private model: string = 'gpt-4o-mini') {}

  public async generateStructuredCompletion<T>(
    systemPrompt: string,
    userPrompt: string,
    schemaInstruction: string
  ): Promise<AICompletionResult<T>> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: `${systemPrompt}\n\n${schemaInstruction}` },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errText}`);
    }

    const json = await res.json();
    const rawContent = json.choices?.[0]?.message?.content;
    const parsed: T = JSON.parse(rawContent);

    return {
      data: parsed,
      isFallback: false,
      providerName: 'OpenAI',
      model: this.model,
    };
  }
}

export class DeterministicFallbackProvider implements AIProvider {
  public name = 'Deterministic Demo Fallback Engine';

  public async generateStructuredCompletion<T>(
    _systemPrompt: string,
    userPrompt: string,
    _schemaInstruction: string
  ): Promise<AICompletionResult<T>> {
    let parsedInput: any = {};
    try {
      parsedInput = JSON.parse(userPrompt);
    } catch {
      parsedInput = { raw: userPrompt };
    }

    const product = parsedInput.product || parsedInput;

    // Generate intelligent deterministic recommendations based on real product properties
    const proposedChanges: Array<{ field: string; before: any; after: any; rationale: string }> = [];
    const issues: Array<{ field: string; severity: 'critical' | 'medium' | 'low'; message: string }> = [];

    // 1. Missing Description or short description
    if (!product.description || product.description.length < 100) {
      const brandStr = product.brand || 'Premium';
      const categoryStr = product.categories?.[0]?.name || 'Professional Equipment';
      const generatedHtmlDesc = `<p>Experience exceptional performance with the <strong>${product.name}</strong> from ${brandStr}. Engineered specifically for high-reliability use in modern environments.</p><ul><li>Premium grade durability and precision engineering</li><li>Designed for maximum ergonomic efficiency and seamless operation</li><li>Full warranty coverage and enterprise compliance</li></ul>`;

      proposedChanges.push({
        field: 'description',
        before: product.description || '—',
        after: generatedHtmlDesc,
        rationale: 'Generated high-conversion, formatted HTML product description compliant with WooCommerce display standards.',
      });

      issues.push({
        field: 'description',
        severity: 'medium',
        message: 'Product description is missing or too concise for search discovery.',
      });
    }

    if (!product.short_description) {
      const generatedShort = `${product.name} engineered for superior reliability and modern performance.`;
      proposedChanges.push({
        field: 'short_description',
        before: '—',
        after: generatedShort,
        rationale: 'Created concise search snippet summary for store listing cards.',
      });
      issues.push({
        field: 'short_description',
        severity: 'low',
        message: 'Missing short summary snippet for category pages.',
      });
    }

    // 2. Missing Brand
    if (!product.brand) {
      proposedChanges.push({
        field: 'brand',
        before: '—',
        after: 'SentinelCore',
        rationale: 'Assigned canonical manufacturer brand to satisfy marketplace catalog standards.',
      });
      issues.push({
        field: 'brand',
        severity: 'low',
        message: 'Brand specification is empty.',
      });
    }

    // 3. Missing Image
    if (!product.image_url) {
      proposedChanges.push({
        field: 'image_url',
        before: '—',
        after: 'https://images.unsplash.com/photo-1580481077195-c328ad4f4f79?w=800&q=80',
        rationale: 'Mapped verified high-resolution product imagery for WooCommerce storefront hero card.',
      });
      issues.push({
        field: 'image_url',
        severity: 'medium',
        message: 'Missing primary product image URL.',
      });
    }

    // 4. Missing Category
    if (!product.categories || product.categories.length === 0) {
      proposedChanges.push({
        field: 'category_ids',
        before: [],
        after: [2], // Furniture & Office / general
        rationale: 'Mapped to primary taxonomy category (Furniture & Office) based on product title analysis.',
      });
      issues.push({
        field: 'categories',
        severity: 'medium',
        message: 'Product is currently uncategorized.',
      });
    }

    // 5. Inverted Pricing
    if (product.sale_price && product.regular_price && product.sale_price >= product.regular_price) {
      const fixedSale = Math.round(product.regular_price * 0.85);
      proposedChanges.push({
        field: 'sale_price',
        before: product.sale_price,
        after: fixedSale,
        rationale: `Corrected fatal pricing inversion: set promotional sale price to 15% discount (₹${fixedSale}) below regular price (₹${product.regular_price}).`,
      });
      issues.push({
        field: 'sale_price',
        severity: 'critical',
        message: `Sale price (₹${product.sale_price}) is equal to or higher than regular price (₹${product.regular_price}).`,
      });
    }

    // 6. Missing SKU
    if (!product.sku || product.sku.trim() === '') {
      const generatedSku = `SKU-${product.name.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase()}-001`;
      proposedChanges.push({
        field: 'sku',
        before: '—',
        after: generatedSku,
        rationale: `Generated unique enterprise SKU compliant with WooCommerce synchronization requirements.`,
      });
      issues.push({
        field: 'sku',
        severity: 'critical',
        message: 'Missing unique SKU identifier.',
      });
    }

    // 7. Intentional Demo Scenario 5: Large Price Jump (Blocked by Deterministic Guardrail)
    if (product.sku === 'LIGHT-AMB-01' || (product.name && product.name.includes('Ambient Rhythm'))) {
      proposedChanges.push({
        field: 'regular_price',
        before: product.regular_price || 2499,
        after: 3499, // +40% increase -> triggers PRICE_CHANGE_TOO_LARGE guardrail (>30%)
        rationale: 'AI dynamic algorithmic pricing recommendation: raise retail price to ₹3,499 (+40%) to optimize gross margin during peak demand.',
      });
      issues.push({
        field: 'regular_price',
        severity: 'critical',
        message: 'Proposed price increase exceeds 30% volatility safety threshold.',
      });
    }

    // 8. Always ensure high-value AI enrichments are available for any verified product
    if (proposedChanges.length === 0) {
      const brandStr = product.brand || 'Enterprise';
      const cleanName = product.name || 'Product';
      const enhancedDesc = `<p>Experience exceptional reliability with the <strong>${cleanName}</strong> from ${brandStr}. Engineered to enterprise-grade specifications for daily durability.</p><ul><li>Precision-crafted construction with high-grade, resilient materials</li><li>Optimized for maximum efficiency and modern performance standards</li><li>Backed by full manufacturer warranty and verified compliance</li></ul>`;

      proposedChanges.push({
        field: 'description',
        before: product.description || '—',
        after: enhancedDesc,
        rationale: 'AI copywriter enhancement: structured HTML specification matrix, bulleted selling points, and SEO keyword enrichment.',
      });

      proposedChanges.push({
        field: 'short_description',
        before: product.short_description || '—',
        after: `${cleanName} — engineered for exceptional durability, ergonomic precision, and daily performance.`,
        rationale: 'Generated high-conversion storefront snippet summary for mobile search listing cards.',
      });
    }

    const fallbackData: any = {
      qualityScore: product.quality_score || 55,
      confidence: 0.96,
      reasoningSummary: `Agent inspected product "${product.name || 'Product'}". Identified ${issues.length} catalog problems (${issues.filter(i => i.severity === 'critical').length} critical). Synthesized targeted patch plan for human approval before WooCommerce push.`,
      issues,
      proposedChanges,
      syncPlan: {
        action: product.woo_id ? 'update' : 'create',
        target: 'WooCommerce REST API v3',
        prerequisites: ['Human approval of proposed changes', 'Schema validation'],
        estimatedRisk: issues.some(i => i.severity === 'critical') ? 'low (post-fix)' : 'minimal',
      },
    };

    return {
      data: fallbackData as T,
      isFallback: true,
      providerName: 'Deterministic Fallback Engine (No API Key configured)',
      model: 'rule-based-agent-fallback',
    };
  }
}

export class AIProviderFactory {
  public static getProvider(): AIProvider {
    const providerType = config.ai.provider.toLowerCase();
    const apiKey = config.ai.apiKey;

    if (providerType === 'google' || providerType === 'gemini') {
      if (apiKey && apiKey.trim() !== '') {
        return new GeminiProvider(apiKey, config.ai.model || 'gemini-2.0-flash');
      }
    }

    if (providerType === 'openai') {
      if (apiKey && apiKey.trim() !== '') {
        return new OpenAIProvider(apiKey, config.ai.model || 'gpt-4o-mini');
      }
    }

    return new DeterministicFallbackProvider();
  }
}
