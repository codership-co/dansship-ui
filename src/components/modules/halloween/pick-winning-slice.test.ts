import { describe, expect, it } from 'vitest';

import {
  HALLOWEEN_SLICES,
  pickWinningSlice,
  rotationForSlice,
  WINNING_SLICE_ID,
  winningSliceIndexes,
} from './pick-winning-slice';

describe('pickWinningSlice', () => {
  it('always returns a free-class slice', () => {
    const winners = new Set(winningSliceIndexes());

    for (let step = 0; step <= 20; step += 1) {
      const index = pickWinningSlice(() => step / 20);

      expect(winners.has(index)).toBe(true);
      expect(HALLOWEEN_SLICES[index].id).toBe(WINNING_SLICE_ID);
    }
  });

  it('can stop on either free-class slice', () => {
    const [first, second] = winningSliceIndexes();

    expect(pickWinningSlice(() => 0)).toBe(first);
    expect(pickWinningSlice(() => 0.99)).toBe(second);
    expect(first).not.toBe(second);
  });
});

describe('rotationForSlice', () => {
  it('centers the chosen slice under the pointer', () => {
    const resting = rotationForSlice(2, 0, 0);
    const landed = rotationForSlice(4, resting, 5);
    const sliceAngle = 360 / HALLOWEEN_SLICES.length;

    expect(((landed % 360) + 360) % 360).toBe((360 - 4 * sliceAngle) % 360);
    expect(landed).toBeGreaterThan(resting);
  });
});
