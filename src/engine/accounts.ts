export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalSide = 'debit' | 'credit';

export interface Account {
  code: string;
  name: string;
  type: AccountType;
  normal: NormalSide;
  /** True for contra accounts such as Accumulated Depreciation. */
  contra?: boolean;
}

export type Chart = readonly Account[];

export function defaultNormal(type: AccountType): NormalSide {
  return type === 'asset' || type === 'expense' ? 'debit' : 'credit';
}

export function getAccount(chart: Chart, code: string): Account | undefined {
  return chart.find((a) => a.code === code);
}

export function requireAccount(chart: Chart, code: string): Account {
  const a = getAccount(chart, code);
  if (!a) throw new Error(`Unknown account code: ${code}`);
  return a;
}