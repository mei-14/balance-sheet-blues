import { describe, expect, it } from 'vitest';
import { gameModes } from '../../content/gameModes';
import { pesos } from '../../engine/money';
import { clampReputation, evaluateMonthEnd } from '../../engine/career';

const easy = gameModes.easy;
const demon = gameModes.demon;

describe('evaluateMonthEnd', () => {
  it('easy mode never ends the campaign', () => {
    const r = evaluateMonthEnd({ cash: -pesos('1000000'), reputation: 0, lowCashMonths: 99 }, easy);
    expect(r.status).toBe('active');
    expect(r.lowCashMonths).toBe(0);
  });
  it('demon: fired at or below the reputation floor, safe above it', () => {
    expect(evaluateMonthEnd({ cash: pesos('1000'), reputation: 15, lowCashMonths: 0 }, demon).status).toBe('fired');
    expect(evaluateMonthEnd({ cash: pesos('1000'), reputation: 16, lowCashMonths: 0 }, demon).status).toBe('active');
  });
  it('demon: bankrupt only after consecutive low-cash month-ends', () => {
    const first = evaluateMonthEnd({ cash: 0, reputation: 60, lowCashMonths: 0 }, demon);
    expect(first).toMatchObject({ status: 'active', lowCashMonths: 1 });
    const second = evaluateMonthEnd({ cash: -500, reputation: 60, lowCashMonths: first.lowCashMonths }, demon);
    expect(second.status).toBe('bankrupt');
  });
  it('recovering cash resets the counter', () => {
    const r = evaluateMonthEnd({ cash: pesos('500'), reputation: 60, lowCashMonths: 1 }, demon);
    expect(r).toMatchObject({ status: 'active', lowCashMonths: 0 });
  });
  it('firing takes precedence over bankruptcy', () => {
    expect(evaluateMonthEnd({ cash: 0, reputation: 5, lowCashMonths: 5 }, demon).status).toBe('fired');
  });
});

describe('clampReputation', () => {
  it('keeps reputation within 0 to 100', () => {
    expect(clampReputation(120)).toBe(100);
    expect(clampReputation(-3)).toBe(0);
    expect(clampReputation(49.6)).toBe(50);
  });
});