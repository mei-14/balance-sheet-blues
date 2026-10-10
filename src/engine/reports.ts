import type { Account, AccountType, Chart } from './accounts';
import type { Centavos } from './money';
import { sum } from './money';
import type { DateFilter, Ledger } from './ledger';
import { naturalBalance, netDebit, rawTotals } from './ledger';

export interface TrialBalanceRow {
  code: string;
  name: string;
  debit: Centavos;
  credit: Centavos;
}
export interface TrialBalance {
  rows: TrialBalanceRow[];
  totalDebit: Centavos;
  totalCredit: Centavos;
  difference: Centavos; // debit - credit; 0 when balanced
  balanced: boolean;
}

export function trialBalance(ledger: Ledger, chart: Chart, filter: DateFilter = {}): TrialBalance {
  const totals = rawTotals(ledger, filter);
  const rows: TrialBalanceRow[] = [];
  for (const acct of [...chart].sort((x, y) => x.code.localeCompare(y.code))) {
    const t = totals[acct.code];
    if (!t) continue;
    const net = netDebit(t);
    rows.push({
      code: acct.code,
      name: acct.name,
      debit: net > 0 ? net : 0,
      credit: net < 0 ? -net : 0,
    });
  }
  const totalDebit = sum(rows.map((r) => r.debit));
  const totalCredit = sum(rows.map((r) => r.credit));
  return {
    rows,
    totalDebit,
    totalCredit,
    difference: totalDebit - totalCredit,
    balanced: totalDebit === totalCredit,
  };
}

export interface ReportLine {
  code: string;
  name: string;
  amount: Centavos;
}

function linesFor(
  ledger: Ledger,
  chart: Chart,
  type: AccountType,
  filter: DateFilter,
  signed: (a: Account, net: Centavos) => Centavos,
): ReportLine[] {
  const totals = rawTotals(ledger, filter);
  return chart
    .filter((a) => a.type === type && totals[a.code])
    .sort((x, y) => x.code.localeCompare(y.code))
    .map((a) => ({ code: a.code, name: a.name, amount: signed(a, netDebit(totals[a.code])) }));
}

export interface IncomeStatement {
  revenue: ReportLine[];
  expenses: ReportLine[];
  totalRevenue: Centavos;
  totalExpenses: Centavos;
  netIncome: Centavos;
}

export function incomeStatement(ledger: Ledger, chart: Chart, filter: DateFilter): IncomeStatement {
  const totals = rawTotals(ledger, filter);
  const natural = (a: Account) => naturalBalance(a, totals[a.code]);
  const revenue = linesFor(ledger, chart, 'revenue', filter, (a) => natural(a));
  const expenses = linesFor(ledger, chart, 'expense', filter, (a) => natural(a));
  const totalRevenue = sum(revenue.map((l) => l.amount));
  const totalExpenses = sum(expenses.map((l) => l.amount));
  return { revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
}

export interface BalanceSheet {
  assets: { lines: ReportLine[]; total: Centavos };
  liabilities: { lines: ReportLine[]; total: Centavos };
  equity: { lines: ReportLine[]; currentEarnings: Centavos; total: Centavos };
  balanced: boolean;
}

/** Cumulative to `asOf`. Current-period earnings are shown inside equity until the books are closed. */
export function balanceSheet(ledger: Ledger, chart: Chart, asOf: string): BalanceSheet {
  const filter: DateFilter = { to: asOf };
  // Assets: debit minus credit, so contra accounts come out negative.
  const assetLines = linesFor(ledger, chart, 'asset', filter, (_a, net) => net);
  const liabLines = linesFor(ledger, chart, 'liability', filter, (_a, net) => -net);
  const equityLines = linesFor(ledger, chart, 'equity', filter, (_a, net) => -net);
  const currentEarnings = incomeStatement(ledger, chart, filter).netIncome;

  const assets = { lines: assetLines, total: sum(assetLines.map((l) => l.amount)) };
  const liabilities = { lines: liabLines, total: sum(liabLines.map((l) => l.amount)) };
  const equity = {
    lines: equityLines,
    currentEarnings,
    total: sum(equityLines.map((l) => l.amount)) + currentEarnings,
  };
  return { assets, liabilities, equity, balanced: assets.total === liabilities.total + equity.total };
}