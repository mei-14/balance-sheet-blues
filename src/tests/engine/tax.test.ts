import { describe, expect, it } from 'vitest';
import { taxRules as rules } from '../../rules/tax';
import { pesos } from '../../engine/money';
import { deadlineRules } from '../../rules/deadlines';
import {
  annualIncomeTaxDeadline,
  corporateIncomeTax,
  monthlyRemittanceDeadline,
  quarterEndDate,
  quarterlyDeadline,
  thirteenthMonthDeadline,
  percentageTax,
  requiresVatRegistration,
  splitVatInclusive,
  vatOnNet,
  vatReturn,
  withholdingTax,
} from '../../engine/tax';

describe('VAT', () => {
  it('computes 12% on net', () => {
    expect(vatOnNet(pesos('100000'), rules)).toBe(pesos('12000'));
  });
  it('splits a VAT-inclusive amount', () => {
    expect(splitVatInclusive(pesos('112000'), rules)).toEqual({ net: pesos('100000'), vat: pesos('12000') });
  });
  it('net + vat always equals gross, even with rounding', () => {
    for (const g of [1, 99, 100, 12345, 99999, 11200001]) {
      const { net, vat } = splitVatInclusive(g, rules);
      expect(net + vat).toBe(g);
    }
    expect(splitVatInclusive(10000, rules)).toEqual({ net: 8929, vat: 1071 }); // ₱100.00 gross
  });
  it('registration is required only above ₱3,000,000', () => {
    expect(requiresVatRegistration(pesos('3000000'), rules)).toBe(false);
    expect(requiresVatRegistration(pesos('3000000.01'), rules)).toBe(true);
  });
  it('VAT return pays the difference or carries excess input forward', () => {
    expect(vatReturn(pesos('12000'), pesos('5000'))).toMatchObject({ payable: pesos('7000'), excessInputVat: 0 });
    expect(vatReturn(pesos('3000'), pesos('5000'))).toMatchObject({ payable: 0, excessInputVat: pesos('2000') });
    expect(vatReturn(pesos('12000'), pesos('5000'), pesos('2000')).payable).toBe(pesos('5000'));
  });
});

describe('percentage tax', () => {
  it('is 3% of quarterly gross sales', () => {
    expect(percentageTax(pesos('300000'), rules)).toBe(pesos('9000'));
  });
});

describe('withholding tax', () => {
  it('applies the category rate to the VAT-exclusive base', () => {
    expect(withholdingTax(pesos('100000'), 'rent', rules)).toBe(pesos('5000'));
    expect(withholdingTax(pesos('100000'), 'goods', rules)).toBe(pesos('1000'));
    expect(withholdingTax(pesos('100000'), 'services', rules)).toBe(pesos('2000'));
    expect(withholdingTax(pesos('100000'), 'professionalFeesIndividualOver3M', rules)).toBe(pesos('10000'));
  });
});

describe('corporate income tax', () => {
  const small = { netTaxableIncome: pesos('1000000'), grossIncome: pesos('5000000'), totalAssetsExLand: pesos('20000000'), yearOfOperation: 2 };

  it('uses the lower rate for small corporations', () => {
    const r = corporateIncomeTax(small, rules);
    expect(r.rateBps).toBe(2000);
    expect(r.taxDue).toBe(pesos('200000'));
    expect(r.mcitApplies).toBe(false);
  });
  it('lower rate boundary: ₱5,000,000 qualifies, one centavo more does not', () => {
    expect(corporateIncomeTax({ ...small, netTaxableIncome: pesos('5000000') }, rules).rateBps).toBe(2000);
    expect(corporateIncomeTax({ ...small, netTaxableIncome: pesos('5000000.01') }, rules).rateBps).toBe(2500);
  });
  it('large assets lose the lower rate', () => {
    expect(corporateIncomeTax({ ...small, totalAssetsExLand: pesos('100000000.01') }, rules).rateBps).toBe(2500);
  });
  it('MCIT applies from year 4 when higher than regular tax', () => {
    const y4 = { ...small, grossIncome: pesos('20000000'), yearOfOperation: 4 };
    const r = corporateIncomeTax(y4, rules);
    expect(r.mcit).toBe(pesos('400000'));
    expect(r.mcitApplies).toBe(true);
    expect(r.taxDue).toBe(pesos('400000'));
    expect(corporateIncomeTax({ ...y4, yearOfOperation: 3 }, rules).taxDue).toBe(pesos('200000'));
  });
  it('a loss pays no regular tax', () => {
    expect(corporateIncomeTax({ ...small, netTaxableIncome: -pesos('500000') }, rules).regularTax).toBe(0);
  });
});

describe('filing deadlines', () => {
  const d = deadlineRules;
  it('finds quarter ends', () => {
    expect(quarterEndDate(2026, 1)).toBe('2026-03-31');
    expect(quarterEndDate(2026, 2)).toBe('2026-06-30');
    expect(quarterEndDate(2028, 4)).toBe('2028-12-31');
  });
  it('VAT and percentage tax are due 25 days after quarter end', () => {
    expect(quarterlyDeadline('vat', 2026, 1, d)).toBe('2026-04-25');
    expect(quarterlyDeadline('percentageTax', 2026, 2, d)).toBe('2026-07-25');
    expect(quarterlyDeadline('vat', 2026, 4, d)).toBe('2027-01-25');
  });
  it('quarterly income tax is due 60 days after quarter end, with no Q4 return', () => {
    expect(quarterlyDeadline('incomeTax', 2026, 1, d)).toBe('2026-05-30');
    expect(quarterlyDeadline('incomeTax', 2026, 2, d)).toBe('2026-08-29');
    expect(quarterlyDeadline('incomeTax', 2026, 4, d)).toBeNull();
  });
  it('annual return is due April 15 of the following year', () => {
    expect(annualIncomeTaxDeadline(2026, d)).toBe('2027-04-15');
  });
  it('monthly remittances fall in the next month, rolling over December', () => {
    expect(monthlyRemittanceDeadline('withholding', 2026, 1, d)).toBe('2026-02-10');
    expect(monthlyRemittanceDeadline('contributions', 2026, 12, d)).toBe('2027-01-10');
  });
  it('13th month pay is due December 24', () => {
    expect(thirteenthMonthDeadline(2026, d)).toBe('2026-12-24');
  });
});