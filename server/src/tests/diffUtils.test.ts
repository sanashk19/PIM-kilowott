import { describe, it, expect } from 'vitest';
import { normalizeValue, valuesEqual, normalizeProductField } from '../utils/diffUtils.js';

describe('VERIDEX Centralized Diff & Normalization Layer', () => {
  describe('normalizeValue', () => {
    it('normalizes numeric strings to numbers', () => {
      expect(normalizeValue('12999')).toBe(12999);
      expect(normalizeValue('12999.00')).toBe(12999);
      expect(normalizeValue('₹12,999')).toBe(12999);
      expect(normalizeValue(12999)).toBe(12999);
    });

    it('handles null, undefined, whitespace, and empty strings uniformly as null', () => {
      expect(normalizeValue(null)).toBeNull();
      expect(normalizeValue(undefined)).toBeNull();
      expect(normalizeValue('')).toBeNull();
      expect(normalizeValue('   ')).toBeNull();
      expect(normalizeValue('—')).toBeNull();
      expect(normalizeValue('null')).toBeNull();
    });

    it('normalizes and sorts arrays for order-independent comparison', () => {
      const arr1 = ['Matte Black', 'Glacier Silver'];
      const arr2 = ['Glacier Silver', 'Matte Black'];
      expect(normalizeValue(arr1)).toEqual(normalizeValue(arr2));
    });

    it('strips html tags when requested', () => {
      const richText = '<p>Engineered with <strong>active noise cancelling</strong>.</p>';
      expect(normalizeValue(richText, { stripHtml: true })).toBe(
        'Engineered with active noise cancelling.'
      );
    });
  });

  describe('valuesEqual', () => {
    it('considers number and numeric string equal (PIM 12999 vs Woo "12999")', () => {
      expect(valuesEqual(12999, '12999')).toBe(true);
      expect(valuesEqual(7499, '7499.00')).toBe(true);
      expect(valuesEqual('₹8,999', 8999)).toBe(true);
    });

    it('considers null and empty string equal', () => {
      expect(valuesEqual(null, '')).toBe(true);
      expect(valuesEqual(undefined, '   ')).toBe(true);
      expect(valuesEqual(null, '—')).toBe(true);
    });

    it('detects genuine numeric differences', () => {
      expect(valuesEqual(12999, 13499)).toBe(false);
      expect(valuesEqual('12999', '13999')).toBe(false);
    });

    it('treats arrays with identical elements in different order as equal', () => {
      expect(valuesEqual(['Electronics', 'Audio'], ['Audio', 'Electronics'])).toBe(true);
    });

    it('detects genuine string differences', () => {
      expect(valuesEqual('Apex Pro', 'Apex Pro Max')).toBe(false);
    });
  });

  describe('normalizeProductField', () => {
    it('correctly routes pricing fields to numeric coercion', () => {
      expect(normalizeProductField('regular_price', ' ₹7,499 ')).toBe(7499);
      expect(normalizeProductField('sale_price', '6999')).toBe(6999);
    });

    it('correctly cleans up description fields with HTML tags', () => {
      const desc = '<p>Premium wireless headset.</p>';
      expect(normalizeProductField('description', desc)).toBe('Premium wireless headset.');
    });
  });
});
