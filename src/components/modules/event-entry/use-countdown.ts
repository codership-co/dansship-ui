import { useEffect, useState } from 'react';

import { codeLifeLeft } from '@core/api';

/** Fraction (1 → 0) of the current code's life, ticking in server time. */
export function useCountdown(refreshAt: string | null, periodSeconds: number | null, skewMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!refreshAt) {
      return undefined;
    }

    const id = window.setInterval(() => setNow(Date.now()), 250);

    return () => window.clearInterval(id);
  }, [refreshAt]);

  if (!refreshAt || !periodSeconds) {
    return 0;
  }

  return codeLifeLeft(refreshAt, periodSeconds, now, skewMs);
}
