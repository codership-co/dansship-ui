export const HALLOWEEN_SLICE_COUNT = 6;
export const HALLOWEEN_SPIN_TURNS = 5;
export const HALLOWEEN_SPIN_DURATION_MS = 7000;
export const HALLOWEEN_REST_INDEX = 2;

export type HalloweenSliceId = 'class' | 'candy' | 'trick' | 'sticker' | 'hug';

export type HalloweenSlice = {
  id: HalloweenSliceId;
  labelKey: `halloween:slices.${HalloweenSliceId}`;
};

export const WINNING_SLICE_ID: HalloweenSliceId = 'class';

export const HALLOWEEN_SLICES: ReadonlyArray<HalloweenSlice> = [
  { id: 'class', labelKey: 'halloween:slices.class' },
  { id: 'candy', labelKey: 'halloween:slices.candy' },
  { id: 'trick', labelKey: 'halloween:slices.trick' },
  { id: 'sticker', labelKey: 'halloween:slices.sticker' },
  { id: 'class', labelKey: 'halloween:slices.class' },
  { id: 'hug', labelKey: 'halloween:slices.hug' },
];

export function winningSliceIndexes(slices: ReadonlyArray<Pick<HalloweenSlice, 'id'>> = HALLOWEEN_SLICES) {
  return slices.flatMap((slice, index) => (slice.id === WINNING_SLICE_ID ? [index] : []));
}

export function pickWinningSlice(
  random: () => number = Math.random,
  slices: ReadonlyArray<HalloweenSlice> = HALLOWEEN_SLICES,
) {
  const winners = winningSliceIndexes(slices);

  if (winners.length === 0) {
    throw new Error('Halloween wheel has no winning slice');
  }

  const roll = Math.min(1, Math.max(0, random()));
  const pick = Math.min(winners.length - 1, Math.floor(roll * winners.length));

  return winners[pick];
}

export function rotationForSlice(
  index: number,
  currentRotation: number,
  extraSpins: number,
  sliceCount = HALLOWEEN_SLICE_COUNT,
) {
  const sliceAngle = 360 / sliceCount;
  const targetMod = (360 - index * sliceAngle) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = targetMod - currentMod;

  if (delta < 0) {
    delta += 360;
  }

  if (delta === 0 && extraSpins === 0) {
    return currentRotation;
  }

  return currentRotation + extraSpins * 360 + delta;
}
