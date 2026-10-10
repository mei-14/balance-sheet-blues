import { chartOfAccounts } from '../content/chartOfAccounts';
import type { GameModeConfig } from '../content/gameModes';
import { gameModes } from '../content/gameModes';
import { requireAccount } from '../engine/accounts';
import type { Centavos } from '../engine/money';
import { naturalBalance, rawTotals } from '../engine/ledger';
import type { GameState } from './store';

const CASH = '1010';

type Slice = Pick<GameState, 'ledger' | 'reputation' | 'status' | 'mode'>;

/** Primitive-returning selectors are safe to pass straight to useGameStore(). */
export function selectCash(s: Pick<GameState, 'ledger'>): Centavos {
  return naturalBalance(requireAccount(chartOfAccounts, CASH), rawTotals(s.ledger)[CASH]);
}

export const selectReputation = (s: Slice): number => s.reputation;
export const selectStatus = (s: Slice) => s.status;
export const selectIsGameOver = (s: Slice): boolean => s.status !== 'active';
export const selectModeConfig = (s: Slice): GameModeConfig | null => (s.mode ? gameModes[s.mode] : null);

/**
 * Selectors that build new objects (trial balance, reports) must not be passed to
 * useGameStore() directly. Select `s.ledger`, then compute with useMemo in the component.
 */
export const selectLedger = (s: Pick<GameState, 'ledger'>) => s.ledger;