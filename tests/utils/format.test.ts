import { describe, expect, it } from 'vitest';
import { formatMoney, formatQty } from '../../src/utils/format';

/** Typographic space between currency symbol and amount (ICU may use NBSP or NNBSP). */
function normalizeCurrencySpaces(s: string): string {
  return s.replaceAll('\u202F', ' ').replaceAll('\u00A0', ' ');
}

describe('formatMoney', () => {
  it('formats integers with two fraction digits', () => {
    expect(normalizeCurrencySpaces(formatMoney(1000))).toBe('Rp 1.000');
    expect(normalizeCurrencySpaces(formatMoney(0))).toBe('Rp 0');
  });

  it('formats decimals with id-ID thousands separators', () => {
    expect(normalizeCurrencySpaces(formatMoney(1234567.89))).toBe('Rp 1.234.567,89');
  });
});

describe('formatQty', () => {
  it('formats integers with id-ID thousands separators', () => {
    expect(formatQty(1000)).toBe('1.000');
    expect(formatQty(1234567)).toBe('1.234.567');
  });

  it('formats zero without a thousands separator', () => {
    expect(formatQty(0)).toBe('0');
  });
});
