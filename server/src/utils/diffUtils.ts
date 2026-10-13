/**
 * VERIDEX Centralized Normalization and Diff Utilities
 * Reusable across Three-Way Diff, Sync Inspector, AI Guardrails, and Adapters.
 */

export interface NormalizeOptions {
  isNumeric?: boolean;
  ignoreCase?: boolean;
  stripHtml?: boolean;
  sortArrays?: boolean;
}

/**
 * Normalizes any value for consistent comparison between PIM and WooCommerce.
 * Coerces numeric strings, trims whitespace, equates null/undefined/empty string,
 * and standardizes array representations.
 */
export function normalizeValue(val: any, options: NormalizeOptions = {}): any {
  if (val === null || val === undefined) {
    return null;
  }

  // Handle boolean
  if (typeof val === 'boolean') {
    return val;
  }

  // Handle numbers
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }

  // Handle strings
  if (typeof val === 'string') {
    let cleaned = val.trim();

    if (options.stripHtml) {
      cleaned = cleaned.replace(/<[^>]*>/g, '').trim();
    }

    if (cleaned === '' || cleaned === '—' || cleaned === 'null' || cleaned === 'undefined') {
      return null;
    }

    // Currency symbols / commas clean up for numeric check
    const numericCandidate = cleaned.replace(/^[₹$€£\s]+/, '').replace(/,/g, '').trim();

    if (options.isNumeric || /^-?\d+(\.\d+)?$/.test(numericCandidate)) {
      const parsed = Number(numericCandidate);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    if (options.ignoreCase) {
      cleaned = cleaned.toLowerCase();
    }

    // Collapse multiple internal whitespaces
    return cleaned.replace(/\s+/g, ' ');
  }

  // Handle Arrays
  if (Array.isArray(val)) {
    const normalizedItems = val
      .map(item => normalizeValue(item, options))
      .filter(item => item !== null && item !== undefined);

    if (options.sortArrays !== false) {
      // Sort for order-independent comparison
      return normalizedItems.sort((a, b) => {
        const strA = typeof a === 'object' ? JSON.stringify(a) : String(a);
        const strB = typeof b === 'object' ? JSON.stringify(b) : String(b);
        return strA.localeCompare(strB);
      });
    }
    return normalizedItems;
  }

  // Handle Objects
  if (typeof val === 'object') {
    const normalizedObj: Record<string, any> = {};
    const sortedKeys = Object.keys(val).sort();
    for (const key of sortedKeys) {
      normalizedObj[key] = normalizeValue(val[key], options);
    }
    return normalizedObj;
  }

  return val;
}

/**
 * Deterministic equality comparison between two field values.
 */
export function valuesEqual(a: any, b: any, options: NormalizeOptions = {}): boolean {
  const normA = normalizeValue(a, options);
  const normB = normalizeValue(b, options);

  // Both are null/empty
  if (normA === null && normB === null) {
    return true;
  }

  // One is null while other is not
  if (normA === null || normB === null) {
    return false;
  }

  // Number comparison with floating-point tolerance
  if (typeof normA === 'number' && typeof normB === 'number') {
    return Math.abs(normA - normB) < 0.0001;
  }

  // Array comparison
  if (Array.isArray(normA) && Array.isArray(normB)) {
    if (normA.length !== normB.length) return false;
    for (let i = 0; i < normA.length; i++) {
      if (!valuesEqual(normA[i], normB[i], options)) {
        return false;
      }
    }
    return true;
  }

  // Object comparison
  if (typeof normA === 'object' && typeof normB === 'object') {
    const keysA = Object.keys(normA);
    const keysB = Object.keys(normB);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!valuesEqual(normA[k], normB[k], options)) {
        return false;
      }
    }
    return true;
  }

  return normA === normB;
}

/**
 * Field-specific normalization helper.
 */
export function normalizeProductField(field: string, val: any): any {
  switch (field) {
    case 'regular_price':
    case 'sale_price':
    case 'price':
      return normalizeValue(val, { isNumeric: true });
    case 'stock_quantity':
      return normalizeValue(val, { isNumeric: true });
    case 'name':
    case 'title':
    case 'sku':
    case 'brand':
      return normalizeValue(val, { ignoreCase: false });
    case 'description':
    case 'short_description':
      return normalizeValue(val, { stripHtml: true });
    case 'categories':
    case 'attributes':
    case 'tags':
      return normalizeValue(val, { sortArrays: true });
    default:
      return normalizeValue(val);
  }
}

/**
 * Formats a field value for display in UI diff tables.
 */
export function formatFieldValue(field: string, val: any): string {
  if (val === null || val === undefined || val === '') {
    return '—';
  }
  if (field === 'regular_price' || field === 'sale_price' || field === 'price') {
    const num = Number(val);
    return isNaN(num) ? String(val) : `₹${num.toLocaleString('en-IN')}`;
  }
  if (field === 'stock_quantity') {
    return `${val} units`;
  }
  if (Array.isArray(val)) {
    return val.map(item => (typeof item === 'object' ? item.name || JSON.stringify(item) : String(item))).join(', ');
  }
  return String(val);
}
