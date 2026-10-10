/**
 * BIR and payroll filing deadlines as data. Simplified for play (no weekend or holiday shifts).
 * Have a Philippine CPA review before release.
 */
export type Quarter = 1 | 2 | 3 | 4;

export interface DeadlineRules {
  asOf: string;
  /** Calendar-year taxpayers. Days counted from the last day of the quarter. */
  quarterly: {
    vatReturnDays: number;
    percentageTaxReturnDays: number;
    incomeTaxReturnDays: number;
    /** Quarterly income tax returns cover Q1 to Q3; Q4 is covered by the annual return. */
    incomeTaxQuarters: Quarter[];
  };
  annual: {
    incomeTaxReturn: { month: number; day: number }; // falls in the year after the tax year
  };
  /** Day of the following month. */
  monthly: {
    withholdingRemittanceDay: number;
    contributionsRemittanceDay: number; // simplified: real due dates vary by employer ID
  };
  thirteenthMonthPay: { month: number; day: number };
}

export const deadlineRules: DeadlineRules = {
  asOf: '2026-10-10',
  quarterly: {
    vatReturnDays: 25,
    percentageTaxReturnDays: 25,
    incomeTaxReturnDays: 60,
    incomeTaxQuarters: [1, 2, 3],
  },
  annual: {
    incomeTaxReturn: { month: 4, day: 15 },
  },
  monthly: {
    withholdingRemittanceDay: 10,
    contributionsRemittanceDay: 10,
  },
  thirteenthMonthPay: { month: 12, day: 24 },
};