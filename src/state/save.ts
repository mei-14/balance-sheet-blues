import type { Chart } from '../engine/accounts';
import type { CareerStatus } from '../engine/career';
import { validateEntry } from '../engine/journal';
import type { JournalEntry } from '../engine/journal';
import type { Ledger } from '../engine/ledger';
import type { GameMode } from '../content/gameModes';

export const SAVE_VERSION = 1;

export interface GameData {
  mode: GameMode;
  ledger: Ledger;
  reputation: number;
  status: CareerStatus;
  lowCashMonths: number;
  currentDate: string; // ISO yyyy-mm-dd
}

interface SaveFile {
  version: number;
  data: unknown;
}

/** Add one function per version bump: migrations[1] upgrades a v1 save to v2, and so on. */
const migrations: Record<number, (data: unknown) => unknown> = {};

export type ParseResult = { ok: true; data: GameData } | { ok: false; error: string };

export function serializeSave(data: GameData): string {
  const file: SaveFile = { version: SAVE_VERSION, data };
  return JSON.stringify(file);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function parseSave(json: string, chart: Chart): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Save file is not valid JSON.' };
  }
  if (!isRecord(raw) || typeof raw.version !== 'number') return { ok: false, error: 'Save file has no version.' };
  if (raw.version > SAVE_VERSION) return { ok: false, error: 'Save is from a newer version of the game.' };

  let data = raw.data;
  for (let v = raw.version; v < SAVE_VERSION; v++) {
    const migrate = migrations[v];
    if (!migrate) return { ok: false, error: `No migration from save version ${v}.` };
    data = migrate(data);
  }

  if (!isRecord(data)) return { ok: false, error: 'Save data is missing.' };
  const { mode, ledger, reputation, status, lowCashMonths, currentDate } = data;
  if (mode !== 'easy' && mode !== 'demon') return { ok: false, error: 'Bad game mode.' };
  if (status !== 'active' && status !== 'bankrupt' && status !== 'fired') return { ok: false, error: 'Bad status.' };
  if (typeof reputation !== 'number' || reputation < 0 || reputation > 100) return { ok: false, error: 'Bad reputation.' };
  if (!Number.isInteger(lowCashMonths) || (lowCashMonths as number) < 0) return { ok: false, error: 'Bad low-cash counter.' };
  if (typeof currentDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(currentDate)) return { ok: false, error: 'Bad date.' };
  if (!isRecord(ledger) || !Array.isArray(ledger.entries)) return { ok: false, error: 'Bad ledger.' };

  const ids = new Set<string>();
  for (const e of ledger.entries as JournalEntry[]) {
    const v = validateEntry(e, chart);
    if (!v.ok) return { ok: false, error: `Corrupt ledger entry: ${v.errors[0]}` };
    if (ids.has(e.id)) return { ok: false, error: `Duplicate entry id ${e.id}.` };
    ids.add(e.id);
  }

  return {
    ok: true,
    data: {
      mode,
      ledger: { entries: ledger.entries as JournalEntry[] },
      reputation,
      status,
      lowCashMonths: lowCashMonths as number,
      currentDate,
    },
  };
}

// Thin browser wrappers. Storage is injectable so the logic stays testable.
type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'setItem'>;

export const slotKey = (slot: number): string => `bsb:save:${slot}`;

export function writeSlot(slot: number, data: GameData, storage: WriteStorage = localStorage): void {
  storage.setItem(slotKey(slot), serializeSave(data));
}

export function readSlot(slot: number, chart: Chart, storage: ReadStorage = localStorage): ParseResult | null {
  const json = storage.getItem(slotKey(slot));
  return json === null ? null : parseSave(json, chart);
}