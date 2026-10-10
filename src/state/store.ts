import { create } from 'zustand';
import { chartOfAccounts } from '../content/chartOfAccounts';
import type { GameMode } from '../content/gameModes';
import { gameModes } from '../content/gameModes';
import type { CareerResult, CareerStatus } from '../engine/career';
import { clampReputation, evaluateMonthEnd } from '../engine/career';
import type { JournalEntry } from '../engine/journal';
import type { Ledger, PostResult } from '../engine/ledger';
import { emptyLedger, postEntry as postToLedger } from '../engine/ledger';
import type { GameData } from './save';
import { selectCash } from './selectors';

export interface GameState {
  mode: GameMode | null;
  ledger: Ledger;
  reputation: number;
  status: CareerStatus;
  lowCashMonths: number;
  currentDate: string;
}

export interface GameActions {
  startCampaign: (mode: GameMode, startDate?: string) => void;
  postEntry: (entry: JournalEntry) => PostResult;
  adjustReputation: (delta: number) => void;
  /** Evaluates bankruptcy and firing for the current mode and updates status. */
  closeMonth: () => CareerResult | null;
  loadGame: (data: GameData) => void;
  getGameData: () => GameData | null;
  reset: () => void;
}

export type GameStore = GameState & GameActions;

const initialState: GameState = {
  mode: null,
  ledger: emptyLedger(),
  reputation: 0,
  status: 'active',
  lowCashMonths: 0,
  currentDate: '2026-01-01',
};

export const useGameStore = create<GameStore>()((set, get) => ({
  ...initialState,

  startCampaign: (mode, startDate = '2026-01-01') =>
    set({
      ...initialState,
      mode,
      reputation: gameModes[mode].startingReputation,
      currentDate: startDate,
    }),

  postEntry: (entry) => {
    const { status, ledger } = get();
    if (status !== 'active') return { ok: false, errors: ['The campaign is over.'] };
    const result = postToLedger(ledger, entry, chartOfAccounts);
    if (result.ok) set({ ledger: result.ledger });
    return result;
  },

  adjustReputation: (delta) => set((s) => ({ reputation: clampReputation(s.reputation + delta) })),

  closeMonth: () => {
    const s = get();
    if (!s.mode || s.status !== 'active') return null;
    const result = evaluateMonthEnd(
      { cash: selectCash(s), reputation: s.reputation, lowCashMonths: s.lowCashMonths },
      gameModes[s.mode],
    );
    set({ status: result.status, lowCashMonths: result.lowCashMonths });
    return result;
  },

  loadGame: (data) => set({ ...data }),

  getGameData: () => {
    const s = get();
    if (!s.mode) return null;
    return {
      mode: s.mode,
      ledger: s.ledger,
      reputation: s.reputation,
      status: s.status,
      lowCashMonths: s.lowCashMonths,
      currentDate: s.currentDate,
    };
  },

  reset: () => set({ ...initialState }),
}));