import { describe, expect, it } from 'vitest';
import { fmtMoney, fmtNum } from './format';

describe('format helpers', () => {
  it('formatea números con separador de miles y dos decimales', () => {
    expect(fmtNum(18500)).toBe('18,500.00');
    expect(fmtNum(0)).toBe('0.00');
  });

  it('formatea importes con el símbolo indicado', () => {
    expect(fmtMoney(18500, 'L.')).toBe('L. 18,500.00');
    expect(fmtMoney(42.5, '$')).toBe('$ 42.50');
  });
});
