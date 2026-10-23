import { describe, expect, it } from 'vitest';

import { pickWinningSlice, rotationForSlice, spreadSlices, type WheelOutcome } from './pick-winning-slice';

const OUTCOMES: Array<WheelOutcome> = [
  { code: 'DISCOUNT_10', weight: 40, labelKey: 'halloween:prizes.discount', percent: 10 },
  { code: 'DISCOUNT_15', weight: 30, labelKey: 'halloween:prizes.discount', percent: 15 },
  { code: 'DISCOUNT_20', weight: 10, labelKey: 'halloween:prizes.discount', percent: 20 },
  { code: 'FREE_CLASS', weight: 20, labelKey: 'halloween:prizes.freeClass', percent: null },
];

describe('spreadSlices', () => {
  it('builds ten equal slices from the default weights without adjacent duplicates', () => {
    const wedges = spreadSlices(OUTCOMES);
    const counts = Object.fromEntries(OUTCOMES.map(outcome => [outcome.code, 0]));

    expect(wedges).toHaveLength(10);
    wedges.forEach((wedge, index) => {
      counts[wedge.code] += 1;
      const next = wedges[(index + 1) % wedges.length];

      expect(wedge.code).not.toBe(next.code);
      expect(wedge.weight).toBe(1);
    });
    expect(counts).toEqual({
      DISCOUNT_10: 4,
      DISCOUNT_15: 3,
      DISCOUNT_20: 1,
      FREE_CLASS: 2,
    });
  });
});

describe('pickWinningSlice', () => {
  it('lands on a slice of the winning prize', () => {
    const wedges = spreadSlices(OUTCOMES);
    const winners = wedges.flatMap((wedge, index) => (wedge.code === 'DISCOUNT_15' ? [index] : []));

    expect(pickWinningSlice('DISCOUNT_15', () => 0, wedges)).toBe(winners[0]);
    expect(pickWinningSlice('DISCOUNT_15', () => 0.99, wedges)).toBe(winners[winners.length - 1]);
    expect(wedges[pickWinningSlice('FREE_CLASS', () => 0.4, wedges)].code).toBe('FREE_CLASS');
  });
});

describe('rotationForSlice', () => {
  it('centers an equal slice under the pointer', () => {
    const wedges = spreadSlices(OUTCOMES);
    const landed = rotationForSlice(4, 0, 5, wedges);
    const sliceAngle = 360 / wedges.length;

    expect(((landed % 360) + 360) % 360).toBe((360 - 4 * sliceAngle) % 360);
    expect(landed).toBeGreaterThan(0);
  });
});
