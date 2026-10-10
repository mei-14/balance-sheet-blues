/** Data only. Numbers are placeholders to tune during balancing (Phase 5). */
export type GameMode = 'easy' | 'demon';

export interface GameModeConfig {
  label: string;
  description: string;
  bankruptcyEnabled: boolean;
  firingEnabled: boolean;
  /** Cash at or below this (centavos) at month-end counts as a low-cash month. */
  bankruptcyCashFloor: number;
  /** Consecutive low-cash month-ends that make the business bankrupt. */
  bankruptcyConsecutiveMonths: number;
  /** Reputation (0-100) at or below this = fired. */
  firingReputationFloor: number;
  startingReputation: number;
  hintsDefault: boolean;
  /** Fraction of a wrong categorization that still earns points. */
  scoringForgiveness: number;
}

export const gameModes: Record<GameMode, GameModeConfig> = {
  easy: {
    label: 'Easy',
    description: 'No punishment. Mistakes cost points, never your career.',
    bankruptcyEnabled: false,
    firingEnabled: false,
    bankruptcyCashFloor: 0,
    bankruptcyConsecutiveMonths: 2,
    firingReputationFloor: 0,
    startingReputation: 50,
    hintsDefault: true,
    scoringForgiveness: 0.5,
  },
  demon: {
    label: 'Demon',
    description: 'Harder campaign. Go bankrupt or lose your reputation and you are done.',
    bankruptcyEnabled: true,
    firingEnabled: true,
    bankruptcyCashFloor: 0,
    bankruptcyConsecutiveMonths: 2,
    firingReputationFloor: 15,
    startingReputation: 40,
    hintsDefault: false,
    scoringForgiveness: 0,
  },
};