export const HALLOWEEN_SPIN_TURNS = 5;
export const HALLOWEEN_SPIN_DURATION_MS = 7000;
export const MAX_EQUAL_SLICES = 24;

export type WheelOutcome = {
  code: string;
  weight: number;
  labelKey: string;
  percent: number | null;
};

export type WheelWedge = WheelOutcome;

function gcd(left: number, right: number): number {
  let a = Math.abs(left);
  let b = Math.abs(right);

  while (b !== 0) {
    const next = a % b;

    a = b;
    b = next;
  }

  return a;
}

function centers(wedges: ReadonlyArray<Pick<WheelWedge, 'weight'>>) {
  const total = wedges.reduce((sum, wedge) => sum + wedge.weight, 0);
  const spans = wedges.map(wedge => (wedge.weight / total) * 360);
  let cursor = -spans[0] / 2;

  return spans.map(span => {
    const center = cursor + span / 2;

    cursor += span;

    return center;
  });
}

export function spreadSlices(outcomes: ReadonlyArray<WheelOutcome>): Array<WheelWedge> {
  const divisor = outcomes.reduce((current, outcome) => gcd(current, outcome.weight), 0);
  const counts = outcomes.map(outcome => outcome.weight / divisor);
  const total = counts.reduce((sum, count) => sum + count, 0);

  if (total > MAX_EQUAL_SLICES) {
    return outcomes.map(outcome => ({ ...outcome }));
  }

  const remaining = [...counts];
  const placed: Array<number> = [];
  let previous = -1;

  while (placed.length < total) {
    let best = -1;

    for (let index = 0; index < remaining.length; index += 1) {
      if (remaining[index] <= 0 || index === previous) {
        continue;
      }

      if (best === -1 || remaining[index] > remaining[best]) {
        best = index;
      }
    }

    if (best === -1) {
      best = remaining.findIndex(count => count > 0);
    }

    remaining[best] -= 1;
    placed.push(best);
    previous = best;
  }

  if (placed.length > 1 && placed[0] === placed[placed.length - 1]) {
    for (let index = 1; index < placed.length - 1; index += 1) {
      const candidate = placed[index];

      if (candidate === placed[0] || placed[index - 1] === placed[placed.length - 1]) {
        continue;
      }

      if (placed[index + 1] === placed[0]) {
        continue;
      }

      placed[index] = placed[placed.length - 1];
      placed[placed.length - 1] = candidate;

      break;
    }
  }

  return placed.map(index => ({ ...outcomes[index], weight: 1 }));
}

export function wedgeIndexes(wedges: ReadonlyArray<Pick<WheelWedge, 'code'>>, code: string) {
  return wedges.flatMap((wedge, index) => (wedge.code === code ? [index] : []));
}

export function pickWinningSlice(code: string, random: () => number = Math.random, wedges: ReadonlyArray<WheelWedge>) {
  const winners = wedgeIndexes(wedges, code);

  if (winners.length === 0) {
    throw new Error('Halloween wheel has no slice for the winning prize');
  }

  const roll = Math.min(1, Math.max(0, random()));
  const pick = Math.min(winners.length - 1, Math.floor(roll * winners.length));

  return winners[pick];
}

export function rotationForSlice(
  index: number,
  currentRotation: number,
  extraSpins: number,
  wedges: ReadonlyArray<Pick<WheelWedge, 'weight'>>,
) {
  const center = centers(wedges)[index];
  const targetMod = (((360 - center) % 360) + 360) % 360;
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

export function wedgeSpan(wedges: ReadonlyArray<Pick<WheelWedge, 'weight'>>, index: number) {
  const total = wedges.reduce((sum, wedge) => sum + wedge.weight, 0);

  return (wedges[index].weight / total) * 360;
}
