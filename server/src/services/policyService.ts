import { getDb } from '../db/connection.js';

export type SystemOwnership = 'PIM' | 'WOOCOMMERCE';

export interface SourceOfTruthPolicies {
  name: SystemOwnership;
  sku: SystemOwnership;
  regular_price: SystemOwnership;
  sale_price: SystemOwnership;
  stock_quantity: SystemOwnership;
  description: SystemOwnership;
  short_description: SystemOwnership;
  categories: SystemOwnership;
  attributes: SystemOwnership;
  image_url: SystemOwnership;
  brand: SystemOwnership;
  [key: string]: SystemOwnership;
}

export const DEFAULT_SOURCE_OF_TRUTH_POLICIES: SourceOfTruthPolicies = {
  name: 'PIM',
  sku: 'PIM',
  regular_price: 'PIM',
  sale_price: 'PIM',
  stock_quantity: 'WOOCOMMERCE',
  description: 'PIM',
  short_description: 'PIM',
  categories: 'PIM',
  attributes: 'PIM',
  image_url: 'PIM',
  brand: 'PIM',
};

export class PolicyService {
  private static SETTINGS_KEY = 'source_of_truth_policies';

  /**
   * Retrieves active field ownership policies.
   */
  public static getPolicies(): SourceOfTruthPolicies {
    try {
      const db = getDb();
      const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(this.SETTINGS_KEY) as any;
      if (row && row.value) {
        return {
          ...DEFAULT_SOURCE_OF_TRUTH_POLICIES,
          ...JSON.parse(row.value),
        };
      }
    } catch (err) {
      console.warn('Could not read policies from DB settings, using defaults.', err);
    }
    return { ...DEFAULT_SOURCE_OF_TRUTH_POLICIES };
  }

  /**
   * Updates field ownership policies.
   */
  public static updatePolicies(updates: Partial<SourceOfTruthPolicies>): SourceOfTruthPolicies {
    const current = this.getPolicies();
    const merged = { ...current, ...updates };

    const db = getDb();
    db.prepare(`
      INSERT INTO settings (key, value)
      VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(this.SETTINGS_KEY, JSON.stringify(merged));

    return merged;
  }

  /**
   * Determines recommended resolution for a specific field based on policy.
   */
  public static getFieldOwnership(field: string): SystemOwnership {
    const policies = this.getPolicies();
    return policies[field] || 'PIM';
  }

  /**
   * Evaluates a set of conflicting fields and returns the overall policy recommendation.
   */
  public static getRecommendedResolution(conflictingFields: string[]): {
    recommendation: 'keep_pim' | 'keep_woo' | 'manual';
    reason: string;
    fieldResolutions: Record<string, SystemOwnership>;
  } {
    const policies = this.getPolicies();
    const fieldResolutions: Record<string, SystemOwnership> = {};

    let pimVotes = 0;
    let wooVotes = 0;

    for (const field of conflictingFields) {
      const owner = policies[field] || 'PIM';
      fieldResolutions[field] = owner;
      if (owner === 'PIM') pimVotes++;
      else wooVotes++;
    }

    if (pimVotes > 0 && wooVotes === 0) {
      return {
        recommendation: 'keep_pim',
        reason: `Source-of-truth policy designates VERIDEX as canonical owner for [${conflictingFields.join(', ')}].`,
        fieldResolutions,
      };
    }

    if (wooVotes > 0 && pimVotes === 0) {
      return {
        recommendation: 'keep_woo',
        reason: `Source-of-truth policy designates WooCommerce as canonical owner for [${conflictingFields.join(', ')}].`,
        fieldResolutions,
      };
    }

    // Mixed
    return {
      recommendation: 'manual',
      reason: `Conflicting fields have divergent ownership policies (PIM: ${pimVotes}, WooCommerce: ${wooVotes}). Manual field selection recommended.`,
      fieldResolutions,
    };
  }
}
