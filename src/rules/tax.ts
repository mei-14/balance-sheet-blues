/**
 * Philippine tax rules as data. Rates are in basis points (1200 = 12%), money in centavos.
 * Simplified for play. Have a Philippine CPA review before release.
 */
import type { Centavos } from '../engine/money';

export type WithholdingCategory =
  | 'goods'
  | 'services'
  | 'rent'
  | 'professionalFeesIndividual'
  | 'professionalFeesIndividualOver3M'
  | 'professionalFeesCorporate';

export interface TaxRules {
  asOf: string;
  vat: {
    rateBps: number;
    registrationThreshold: Centavos; // annual gross sales; exceeding it requires VAT registration
  };
  percentageTax: {
    nonVatRateBps: number; // quarterly, on gross sales of non-VAT taxpayers
  };
  corporateIncomeTax: {
    regularRateBps: number;
    lowerRateBps: number; // small corporations
    lowerRateMaxNetTaxableIncome: Centavos;
    lowerRateMaxTotalAssetsExLand: Centavos;
    mcitRateBps: number; // on gross income
    mcitStartsInOperationYear: number; // MCIT applies from this year of operation onward
  };
  withholding: Record<WithholdingCategory, number>; // expanded withholding rates, bps
}

export const taxRules: TaxRules = {
  asOf: '2026-10-10',
  vat: {
    rateBps: 1200,
    registrationThreshold: 300_000_000, // ₱3,000,000
  },
  percentageTax: {
    nonVatRateBps: 300,
  },
  corporateIncomeTax: {
    regularRateBps: 2500,
    lowerRateBps: 2000,
    lowerRateMaxNetTaxableIncome: 500_000_000, // ₱5,000,000
    lowerRateMaxTotalAssetsExLand: 10_000_000_000, // ₱100,000,000
    mcitRateBps: 200,
    mcitStartsInOperationYear: 4,
  },
  withholding: {
    goods: 100,
    services: 200,
    rent: 500,
    professionalFeesIndividual: 500,
    professionalFeesIndividualOver3M: 1000,
    professionalFeesCorporate: 1000,
  },
};