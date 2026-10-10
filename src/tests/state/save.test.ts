import { describe, expect, it } from 'vitest';
import { chartOfAccounts as chart } from '../../content/chartOfAccounts';
import { credit, debit } from '../../engine/journal';
import { parseSave, readSlot, serializeSave, writeSlot } from '../../state/save';
import type { GameData } from '../../state/save';

const sample: GameData = {
  mode: 'demon',
  ledger: { entries: [{ id: 'e1', date: '2026-01-02', memo: 'capital', lines: [debit('1010', 100000), credit('3010', 100000)] }] },
  reputation: 42,
  status: 'active',
  lowCashMonths: 0,
  currentDate: '2026-01-31',
};

describe('save format', () => {
  it('round-trips', () => {
    const r = parseSave(serializeSave(sample), chart);
    expect(r).toEqual({ ok: true, data: sample });
  });
  it('rejects garbage, future versions, and bad fields', () => {
    expect(parseSave('not json', chart).ok).toBe(false);
    expect(parseSave(JSON.stringify({ version: 999, data: {} }), chart).ok).toBe(false);
    expect(parseSave(JSON.stringify({ version: 1, data: { ...sample, mode: 'nightmare' } }), chart).ok).toBe(false);
    expect(parseSave(JSON.stringify({ version: 1, data: { ...sample, reputation: 500 } }), chart).ok).toBe(false);
  });
  it('rejects a save whose ledger was tampered into an unbalanced entry', () => {
    const bad = structuredClone(sample);
    bad.ledger.entries[0]!.lines[0]!.debit = 5;
    expect(parseSave(serializeSave(bad), chart).ok).toBe(false);
  });
});

describe('slots', () => {
  it('writes and reads through injected storage', () => {
    const mem = new Map<string, string>();
    const storage = { setItem: (k: string, v: string) => void mem.set(k, v), getItem: (k: string) => mem.get(k) ?? null };
    expect(readSlot(1, chart, storage)).toBeNull();
    writeSlot(1, sample, storage);
    expect(readSlot(1, chart, storage)).toEqual({ ok: true, data: sample });
  });
});