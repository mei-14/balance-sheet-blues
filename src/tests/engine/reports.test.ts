import { describe, expect, it } from 'vitest';
import { chartOfAccounts as chart } from '../../content/chartOfAccounts';
import { credit, debit } from '../../engine/journal';
import type { JournalEntry } from '../../engine/journal';
import type { Ledger } from '../../engine/ledger';
import { emptyLedger, postEntry } from '../../engine/ledger';
import { pesos } from '../../engine/money';
import { balanceSheet, incomeStatement, trialBalance } from '../../engine/reports';

function build(entries: JournalEntry[]): Ledger {
  let l = emptyLedger();
  for (const e of entries) {
    const r = postEntry(l, e, chart);
    if (!r.ok) throw new Error(r.errors.join());
    l = r.ledger;
  }
  return l;
}
const e = (id: string, date: string, lines: JournalEntry['lines']): JournalEntry => ({ id, date, memo: id, lines });

const ledger = build([
  e('cap', '2026-01-02', [debit('1010', pesos('500000')), credit('3010', pesos('500000'))]),
  e('van', '2026-01-05', [debit('1220', pesos('240000')), credit('1010', pesos('240000'))]),
  e('sale', '2026-01-10', [debit('1010', pesos('112000')), credit('4010', pesos('100000')), credit('2020', pesos('12000'))]),
  e('rent', '2026-01-15', [debit('5110', pesos('20000')), credit('1010', pesos('20000'))]),
  e('dep', '2026-01-31', [debit('5180', pesos('4000')), credit('1290', pesos('4000'))]),
]);

describe('trialBalance', () => {
  it('balances and lists accounts in code order', () => {
    const tb = trialBalance(ledger, chart);
    expect(tb.balanced).toBe(true);
    expect(tb.difference).toBe(0);
    expect(tb.rows.map((r) => r.code)).toEqual([...tb.rows.map((r) => r.code)].sort());
  });
  it('puts a contra account on the credit side', () => {
    const row = trialBalance(ledger, chart).rows.find((r) => r.code === '1290');
    expect(row?.credit).toBe(pesos('4000'));
    expect(row?.debit).toBe(0);
  });
});

describe('incomeStatement', () => {
  it('computes net income for the period', () => {
    const is = incomeStatement(ledger, chart, { from: '2026-01-01', to: '2026-01-31' });
    expect(is.totalRevenue).toBe(pesos('100000'));
    expect(is.totalExpenses).toBe(pesos('24000'));
    expect(is.netIncome).toBe(pesos('76000'));
  });
  it('respects the date window', () => {
    const is = incomeStatement(ledger, chart, { from: '2026-02-01', to: '2026-02-28' });
    expect(is.netIncome).toBe(0);
  });
});

describe('balanceSheet', () => {
  it('balances, with accumulated depreciation reducing assets', () => {
    const bs = balanceSheet(ledger, chart, '2026-01-31');
    expect(bs.balanced).toBe(true);
    expect(bs.equity.currentEarnings).toBe(pesos('76000'));
    const accDep = bs.assets.lines.find((l) => l.code === '1290');
    expect(accDep?.amount).toBe(-pesos('4000'));
    expect(bs.assets.total).toBe(pesos('500000') - pesos('240000') + pesos('112000') - pesos('20000') + pesos('240000') - pesos('4000'));
  });
  it('is cumulative only up to asOf', () => {
    const bs = balanceSheet(ledger, chart, '2026-01-04');
    expect(bs.assets.total).toBe(pesos('500000'));
    expect(bs.balanced).toBe(true);
  });
});