import type { Account, Chart } from './accounts';
import type { Centavos } from './money';
import type { JournalEntry } from './journal';
import { validateEntry } from './journal';

export interface Ledger {
  entries: readonly JournalEntry[];
}

export interface DateFilter {
  from?: string; // inclusive, ISO
  to?: string; // inclusive, ISO
}

export interface RawTotals {
  debit: Centavos;
  credit: Centavos;
}

export type PostResult = { ok: true; ledger: Ledger } | { ok: false; errors: string[] };

export function emptyLedger(): Ledger {
  return { entries: [] };
}

/** Pure: returns a new ledger, or the reasons the entry was rejected. */
export function postEntry(ledger: Ledger, entry: JournalEntry, chart: Chart): PostResult {
  const v = validateEntry(entry, chart);
  if (!v.ok) return v;
  if (ledger.entries.some((e) => e.id === entry.id)) {
    return { ok: false, errors: [`Entry id ${entry.id} already posted.`] };
  }
  return { ok: true, ledger: { entries: [...ledger.entries, entry] } };
}

export function rawTotals(ledger: Ledger, filter: DateFilter = {}): Record<string, RawTotals> {
  const totals: Record<string, RawTotals> = {};
  for (const e of ledger.entries) {
    if (filter.from && e.date < filter.from) continue;
    if (filter.to && e.date > filter.to) continue;
    for (const l of e.lines) {
      const t = (totals[l.account] ??= { debit: 0, credit: 0 });
      t.debit += l.debit;
      t.credit += l.credit;
    }
  }
  return totals;
}

/** Net debit minus credit. Positive = debit balance. */
export function netDebit(t: RawTotals | undefined): Centavos {
  return t ? t.debit - t.credit : 0;
}

/** Balance on the account's normal side (positive means "normal"). */
export function naturalBalance(account: Account, t: RawTotals | undefined): Centavos {
  const net = netDebit(t);
  return account.normal === 'debit' ? net : -net;
}