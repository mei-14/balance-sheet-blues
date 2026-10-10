import type { Centavos } from './money';

export type CareerStatus = 'active' | 'bankrupt' | 'fired';

/** Plain data. A GameModeConfig satisfies this structurally. */
export interface CareerRules {
  bankruptcyEnabled: boolean;
  firingEnabled: boolean;
  bankruptcyCashFloor: Centavos;
  bankruptcyConsecutiveMonths: number;
  firingReputationFloor: number;
}

export interface MonthEndInput {
  cash: Centavos;
  reputation: number;
  lowCashMonths: number; // consecutive low-cash month-ends before this one
}

export interface CareerResult {
  status: CareerStatus;
  reason: string | null;
  lowCashMonths: number;
}

export function clampReputation(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** Run at month-end. Firing is checked before bankruptcy. */
export function evaluateMonthEnd(input: MonthEndInput, rules: CareerRules): CareerResult {
  const isLow = rules.bankruptcyEnabled && input.cash <= rules.bankruptcyCashFloor;
  const lowCashMonths = isLow ? input.lowCashMonths + 1 : 0;

  if (rules.firingEnabled && input.reputation <= rules.firingReputationFloor) {
    return { status: 'fired', reason: 'Your reputation collapsed and the owner let you go.', lowCashMonths };
  }
  if (rules.bankruptcyEnabled && lowCashMonths >= rules.bankruptcyConsecutiveMonths) {
    return { status: 'bankrupt', reason: 'The business ran out of cash and closed.', lowCashMonths };
  }
  return { status: 'active', reason: null, lowCashMonths };
}