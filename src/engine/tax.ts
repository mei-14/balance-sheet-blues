import type { Centavos } from './money';
import { mulBps } from './money';
import type { DeadlineRules, Quarter } from '../rules/deadlines';
import type { TaxRules, WithholdingCategory } from '../rules/tax';

/** VAT on a VAT-exclusive (net) amount. */
export function vatOnNet(net: Centavos, rules: TaxRules): Centavos {
  return mulBps(net, rules.vat.rateBps);
}

/** Split a VAT-inclusive gross amount into net and VAT. Net is rounded half up; VAT is the remainder. */
export function splitVatInclusive(gross: Centavos, rules: TaxRules): { net: Centavos; vat: Centavos } {
  if (!Number.isSafeInteger(gross) || gross < 0) throw new Error('gross must be non-negative integer centavos');
  const divisor = 10000 + rules.vat.rateBps;
  const net = Math.floor((gross * 10000 * 2 + divisor) / (2 * divisor));
  return { net, vat: gross - net };
}

/** Annual gross sales above the threshold require VAT registration. Exactly at the threshold does not. */
export function requiresVatRegistration(annualGrossSales: Centavos, rules: TaxRules): boolean {
  return annualGrossSales > rules.vat.registrationThreshold;
}

export interface VatReturn {
  outputVat: Centavos;
  inputVat: Centavos;
  carriedOverInputVat: Centavos;
  payable: Centavos; // 0 if input exceeds output
  excessInputVat: Centavos; // carried to the next quarter
}

export function vatReturn(outputVat: Centavos, inputVat: Centavos, carriedOverInputVat = 0): VatReturn {
  const net = outputVat - inputVat - carriedOverInputVat;
  return {
    outputVat,
    inputVat,
    carriedOverInputVat,
    payable: Math.max(net, 0),
    excessInputVat: Math.max(-net, 0),
  };
}

/** Quarterly percentage tax for a non-VAT taxpayer, on gross sales. */
export function percentageTax(quarterlyGrossSales: Centavos, rules: TaxRules): Centavos {
  return mulBps(quarterlyGrossSales, rules.percentageTax.nonVatRateBps);
}

/** Expanded withholding tax. `base` is the amount excluding VAT. */
export function withholdingTax(base: Centavos, category: WithholdingCategory, rules: TaxRules): Centavos {
  return mulBps(base, rules.withholding[category]);
}

export interface CorporateTaxInput {
  netTaxableIncome: Centavos;
  grossIncome: Centavos;
  totalAssetsExLand: Centavos;
  yearOfOperation: number; // 1 = first taxable year
}

export interface CorporateTaxResult {
  rateBps: number;
  regularTax: Centavos;
  mcit: Centavos;
  mcitApplies: boolean; // true when MCIT is in force and is higher than the regular tax
  taxDue: Centavos;
}

export function corporateIncomeTax(input: CorporateTaxInput, rules: TaxRules): CorporateTaxResult {
  const r = rules.corporateIncomeTax;
  const small =
    input.netTaxableIncome <= r.lowerRateMaxNetTaxableIncome &&
    input.totalAssetsExLand <= r.lowerRateMaxTotalAssetsExLand;
  const rateBps = small ? r.lowerRateBps : r.regularRateBps;
  const regularTax = mulBps(Math.max(input.netTaxableIncome, 0), rateBps);
  const mcitInForce = input.yearOfOperation >= r.mcitStartsInOperationYear;
  const mcit = mcitInForce ? mulBps(Math.max(input.grossIncome, 0), r.mcitRateBps) : 0;
  const mcitApplies = mcitInForce && mcit > regularTax;
  return { rateBps, regularTax, mcit, mcitApplies, taxDue: mcitApplies ? mcit : regularTax };
}

// ---- BIR filing deadlines (dates are ISO yyyy-mm-dd strings; UTC math avoids timezone bugs) ----

export type QuarterlyReturn = 'vat' | 'percentageTax' | 'incomeTax';

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function quarterEndDate(year: number, quarter: Quarter): string {
  const month = quarter * 3;
  return isoDate(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate());
}

/** Returns null when no return is due for that quarter (income tax has no Q4 quarterly return). */
export function quarterlyDeadline(
  kind: QuarterlyReturn,
  year: number,
  quarter: Quarter,
  rules: DeadlineRules,
): string | null {
  const q = rules.quarterly;
  const end = quarterEndDate(year, quarter);
  if (kind === 'vat') return addDaysIso(end, q.vatReturnDays);
  if (kind === 'percentageTax') return addDaysIso(end, q.percentageTaxReturnDays);
  return q.incomeTaxQuarters.includes(quarter) ? addDaysIso(end, q.incomeTaxReturnDays) : null;
}

/** Annual income tax return for a tax year; due in the following calendar year. */
export function annualIncomeTaxDeadline(taxYear: number, rules: DeadlineRules): string {
  const d = rules.annual.incomeTaxReturn;
  return isoDate(taxYear + 1, d.month, d.day);
}

/** Remittance for `month` (1-12) of `year` is due in the following month. */
export function monthlyRemittanceDeadline(
  kind: 'withholding' | 'contributions',
  year: number,
  month: number,
  rules: DeadlineRules,
): string {
  const day =
    kind === 'withholding' ? rules.monthly.withholdingRemittanceDay : rules.monthly.contributionsRemittanceDay;
  return month === 12 ? isoDate(year + 1, 1, day) : isoDate(year, month + 1, day);
}

export function thirteenthMonthDeadline(year: number, rules: DeadlineRules): string {
  const d = rules.thirteenthMonthPay;
  return isoDate(year, d.month, d.day);
}