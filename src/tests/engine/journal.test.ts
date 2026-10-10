import { describe, expect, it } from 'vitest';
import { chartOfAccounts as chart } from '../../content/chartOfAccounts';
import { credit, debit, validateEntry } from '../../engine/journal';
import type { JournalEntry } from '../../engine/journal';

const base = (lines: JournalEntry['lines']): JournalEntry => ({
  id: 'e1',
  date: '2026-01-05',
  memo: 'test',
  lines,
});

describe('validateEntry', () => {
  it('accepts a balanced entry', () => {
    expect(validateEntry(base([debit('1010', 100), credit('3010', 100)]), chart).ok).toBe(true);
  });
  it('rejects unbalanced entries', () => {
    const r = validateEntry(base([debit('1010', 100), credit('3010', 99)]), chart);
    expect(r.ok).toBe(false);
  });
  it('rejects one-sided entries', () => {
    expect(validateEntry(base([debit('1010', 100)]), chart).ok).toBe(false);
  });
  it('rejects unknown accounts, floats, negatives, and two-sided lines', () => {
    expect(validateEntry(base([debit('9999', 100), credit('3010', 100)]), chart).ok).toBe(false);
    expect(validateEntry(base([debit('1010', 10.5), credit('3010', 10.5)]), chart).ok).toBe(false);
    expect(validateEntry(base([debit('1010', -100), credit('3010', -100)]), chart).ok).toBe(false);
    expect(
      validateEntry(base([{ account: '1010', debit: 5, credit: 5 }, credit('3010', 0)]), chart).ok,
    ).toBe(false);
  });
  it('rejects bad dates', () => {
    const e = { ...base([debit('1010', 1), credit('3010', 1)]), date: '5 Jan 2026' };
    expect(validateEntry(e, chart).ok).toBe(false);
  });
});