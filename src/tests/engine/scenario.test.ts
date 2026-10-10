import { describe, expect, it } from 'vitest';
import { chartOfAccounts as chart } from '../../content/chartOfAccounts';
import { credit, debit } from '../../engine/journal';
import type { JournalEntry } from '../../engine/journal';
import { emptyLedger, naturalBalance, postEntry, rawTotals } from '../../engine/ledger';
import type { Ledger } from '../../engine/ledger';
import { requireAccount } from '../../engine/accounts';
import { pesos } from '../../engine/money';
import { monthlyContributions } from '../../engine/payroll';
import { balanceSheet, incomeStatement, trialBalance } from '../../engine/reports';
import { splitVatInclusive, vatOnNet, vatReturn, withholdingTax } from '../../engine/tax';
import { contributionRules } from '../../rules/contributions';
import { taxRules } from '../../rules/tax';

/** One sample month (January 2026) for a small VAT-registered trading company. */
function januaryLedger(): Ledger {
  const entries: JournalEntry[] = [];
  const add = (id: string, date: string, memo: string, lines: JournalEntry['lines']) =>
    entries.push({ id, date, memo, lines });

  add('j01', '2026-01-02', 'Owner invests cash', [debit('1010', pesos('1000000')), credit('3010', pesos('1000000'))]);

  const purchaseNet = pesos('200000');
  const purchaseVat = vatOnNet(purchaseNet, taxRules);
  add('j02', '2026-01-05', 'Buy goods on account', [
    debit('1030', purchaseNet),
    debit('1050', purchaseVat),
    credit('2010', purchaseNet + purchaseVat),
  ]);

  const sale = splitVatInclusive(pesos('336000'), taxRules);
  add('j03', '2026-01-12', 'Cash sales, VAT-inclusive', [
    debit('1010', pesos('336000')),
    credit('4010', sale.net),
    credit('2020', sale.vat),
  ]);

  add('j04', '2026-01-31', 'Cost of goods sold', [debit('5010', pesos('150000')), credit('1030', pesos('150000'))]);

  const rent = pesos('20000');
  const rentEwt = withholdingTax(rent, 'rent', taxRules);
  add('j05', '2026-01-15', 'Pay rent, withhold 5%', [
    debit('5110', rent),
    credit('1010', rent - rentEwt),
    credit('2040', rentEwt),
  ]);

  const c = monthlyContributions(pesos('30000'), contributionRules);
  const salary = pesos('30000');
  add('j06', '2026-01-31', 'January payroll', [
    debit('5130', salary + c.employerTotal),
    credit('1010', salary - c.employeeTotal),
    credit('2050', c.employeeTotal + c.employerTotal),
  ]);

  let ledger = emptyLedger();
  for (const e of entries) {
    const r = postEntry(ledger, e, chart);
    if (!r.ok) throw new Error(`${e.id}: ${r.errors.join(' ')}`);
    ledger = r.ledger;
  }
  return ledger;
}

describe('sample month: January 2026', () => {
  const ledger = januaryLedger();

  it('trial balance balances', () => {
    const tb = trialBalance(ledger, chart);
    expect(tb.balanced).toBe(true);
    expect(tb.totalDebit).toBeGreaterThan(0);
  });

  it('income statement', () => {
    const is = incomeStatement(ledger, chart, { from: '2026-01-01', to: '2026-01-31' });
    expect(is.totalRevenue).toBe(pesos('300000'));
    expect(is.totalExpenses).toBe(pesos('150000') + pesos('20000') + pesos('33980'));
    expect(is.netIncome).toBe(pesos('96020'));
  });

  it('balance sheet balances and cash is right', () => {
    const bs = balanceSheet(ledger, chart, '2026-01-31');
    expect(bs.balanced).toBe(true);
    expect(bs.assets.total).toBe(pesos('1363450'));
    const cash = naturalBalance(requireAccount(chart, '1010'), rawTotals(ledger)['1010']);
    expect(cash).toBe(pesos('1289450'));
  });

  it('VAT return: output ₱36,000 less input ₱24,000 leaves ₱12,000 payable', () => {
    const totals = rawTotals(ledger);
    const output = naturalBalance(requireAccount(chart, '2020'), totals['2020']);
    const input = naturalBalance(requireAccount(chart, '1050'), totals['1050']);
    expect(vatReturn(output, input).payable).toBe(pesos('12000'));
  });

  it('payroll liabilities and withholding tax are recorded', () => {
    const totals = rawTotals(ledger);
    expect(naturalBalance(requireAccount(chart, '2050'), totals['2050'])).toBe(pesos('6430'));
    expect(naturalBalance(requireAccount(chart, '2040'), totals['2040'])).toBe(pesos('1000'));
  });
});