import { describe, expect, it } from 'vitest';
import { chartOfAccounts as chart } from '../../content/chartOfAccounts';
import { credit, debit } from '../../engine/journal';
import type { JournalEntry } from '../../engine/journal';
import { emptyLedger, naturalBalance, postEntry, rawTotals } from '../../engine/ledger';
import { requireAccount } from '../../engine/accounts';

const entry = (id: string, date: string, lines: JournalEntry['lines']): JournalEntry => ({
  id, date, memo: id, lines,
});

describe('postEntry', () => {
  it('posts a valid entry without mutating the old ledger', () => {
    const l0 = emptyLedger();
    const r = postEntry(l0, entry('a', '2026-01-02', [debit('1010', 500), credit('3010', 500)]), chart);
    expect(r.ok).toBe(true);
    expect(l0.entries).toHaveLength(0);
    if (r.ok) expect(r.ledger.entries).toHaveLength(1);
  });
  it('rejects invalid and duplicate-id entries', () => {
    const bad = postEntry(emptyLedger(), entry('a', '2026-01-02', [debit('1010', 5)]), chart);
    expect(bad.ok).toBe(false);
    const first = postEntry(emptyLedger(), entry('a', '2026-01-02', [debit('1010', 5), credit('3010', 5)]), chart);
    if (!first.ok) throw new Error('setup failed');
    const dup = postEntry(first.ledger, entry('a', '2026-01-03', [debit('1010', 5), credit('3010', 5)]), chart);
    expect(dup.ok).toBe(false);
  });
});

describe('balances', () => {
  it('filters by date and respects normal sides', () => {
    let l = emptyLedger();
    for (const e of [
      entry('1', '2026-01-02', [debit('1010', 1000), credit('3010', 1000)]),
      entry('2', '2026-02-02', [debit('1010', 300), credit('4010', 300)]),
    ]) {
      const r = postEntry(l, e, chart);
      if (!r.ok) throw new Error(r.errors.join());
      l = r.ledger;
    }
    const jan = rawTotals(l, { to: '2026-01-31' });
    expect(naturalBalance(requireAccount(chart, '1010'), jan['1010'])).toBe(1000);
    const all = rawTotals(l);
    expect(naturalBalance(requireAccount(chart, '1010'), all['1010'])).toBe(1300);
    expect(naturalBalance(requireAccount(chart, '4010'), all['4010'])).toBe(300);
  });
});