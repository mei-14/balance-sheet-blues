import { describe, expect, it } from 'vitest';
import { formatPeso, mulBps, pesos, sum } from '../../engine/money';

describe('pesos', () => {
  it('parses strings to centavos', () => {
    expect(pesos('1,234.56')).toBe(123456);
    expect(pesos('₱10')).toBe(1000);
    expect(pesos('0.5')).toBe(50);
    expect(pesos('-2.05')).toBe(-205);
  });
  it('avoids float drift', () => {
    expect(pesos(19.99)).toBe(1999);
    expect(pesos(1.1) + pesos(2.2)).toBe(330);
  });
  it('rejects junk', () => {
    expect(() => pesos('abc')).toThrow();
    expect(() => pesos('1.234')).toThrow();
  });
});

describe('mulBps', () => {
  it('computes 12% VAT', () => {
    expect(mulBps(pesos('1000'), 1200)).toBe(pesos('120'));
  });
  it('rounds half away from zero', () => {
    expect(mulBps(5, 1000)).toBe(1); // 0.5 -> 1
    expect(mulBps(-5, 1000)).toBe(-1);
    expect(mulBps(4, 1000)).toBe(0);
  });
});

describe('formatPeso / sum', () => {
  it('formats', () => {
    expect(formatPeso(123456789)).toBe('₱1,234,567.89');
    expect(formatPeso(-5)).toBe('-₱0.05');
  });
  it('sums', () => expect(sum([1, 2, 3])).toBe(6));
});