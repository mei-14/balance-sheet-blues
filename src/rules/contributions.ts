/**
 * SSS, PhilHealth and Pag-IBIG rules as data. Rates in basis points, money in centavos.
 * Simplified for play. Have a Philippine CPA review before release.
 */
import type { Centavos } from '../engine/money';

export interface ContributionRules {
  asOf: string;
  sss: {
    employeeRateBps: number;
    employerRateBps: number;
    minMonthlySalaryCredit: Centavos;
    maxMonthlySalaryCredit: Centavos;
    mscStep: Centavos; // salary is rounded to the nearest step to get the credit
    /** Employees' Compensation: employer only, flat amount by credit level. */
    ecBelowThreshold: Centavos;
    ecAtOrAboveThreshold: Centavos;
    ecThresholdMsc: Centavos;
  };
  philhealth: {
    premiumRateBps: number; // split equally between employee and employer
    salaryFloor: Centavos;
    salaryCeiling: Centavos;
  };
  pagibig: {
    employeeRateBps: number;
    employerRateBps: number;
    maxFundSalary: Centavos;
  };
}

export const contributionRules: ContributionRules = {
  asOf: '2026-10-10',
  sss: {
    employeeRateBps: 500,
    employerRateBps: 1000,
    minMonthlySalaryCredit: 500_000, // ₱5,000
    maxMonthlySalaryCredit: 3_500_000, // ₱35,000
    mscStep: 50_000, // ₱500
    ecBelowThreshold: 1_000, // ₱10
    ecAtOrAboveThreshold: 3_000, // ₱30
    ecThresholdMsc: 1_500_000, // ₱15,000
  },
  philhealth: {
    premiumRateBps: 500,
    salaryFloor: 1_000_000, // ₱10,000
    salaryCeiling: 10_000_000, // ₱100,000
  },
  pagibig: {
    employeeRateBps: 200,
    employerRateBps: 200,
    maxFundSalary: 1_000_000, // ₱10,000
  },
};