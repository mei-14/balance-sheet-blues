import type { Chart } from './accounts';
import { getAccount } from './accounts';
import type { Centavos } from './money';
import { isCentavos, sum } from './money';

export interface JournalLine {
  account: string; // account code
  debit: Centavos;
  credit: Centavos;
}

export interface JournalEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  memo: string;
  lines: JournalLine[];
}

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function debit(account: string, amount: Centavos): JournalLine {
  return { account, debit: amount, credit: 0 };
}
export function credit(account: string, amount: Centavos): JournalLine {
  return { account, debit: 0, credit: amount };
}

export function validateEntry(entry: JournalEntry, chart: Chart): ValidationResult {
  const errors: string[] = [];

  if (!entry.id) errors.push('Entry needs an id.');
  if (!ISO_DATE.test(entry.date)) errors.push(`Bad date "${entry.date}", use yyyy-mm-dd.`);
  if (entry.lines.length < 2) errors.push('An entry needs at least two lines.');

  for (const [i, line] of entry.lines.entries()) {
    const n = i + 1;
    if (!getAccount(chart, line.account)) errors.push(`Line ${n}: unknown account ${line.account}.`);
    if (!isCentavos(line.debit) || !isCentavos(line.credit)) {
      errors.push(`Line ${n}: amounts must be integer centavos.`);
      continue;
    }
    if (line.debit < 0 || line.credit < 0) errors.push(`Line ${n}: amounts cannot be negative.`);
    if ((line.debit > 0) === (line.credit > 0)) {
      errors.push(`Line ${n}: put the amount on exactly one side.`);
    }
  }

  const d = sum(entry.lines.map((l) => l.debit));
  const c = sum(entry.lines.map((l) => l.credit));
  if (d !== c) errors.push(`Entry does not balance: debits ${d}, credits ${c}.`);

  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}