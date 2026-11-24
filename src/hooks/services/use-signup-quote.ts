import { useCallback, useState } from 'react';

import { DansshipAPI, type AdminEnrollmentPayload, type SignupApplication } from '@core/api';

/**
 * One quote shape for the person's signup and the admin enrollment summary:
 * total, discount, deposit (what is paid now) and balance.
 */
export interface SignupQuoteSummary {
  chargesMoney: boolean;
  total: number;
  discountPercent: number | null;
  deposit: number;
  balance: number;
}

export type SignupQuoteSource =
  | { kind: 'signup'; slug: string; payload: SignupApplication }
  | { kind: 'enrollment'; eventId: string; payload: AdminEnrollmentPayload };

export async function fetchSignupQuote(source: SignupQuoteSource) {
  if (source.kind === 'enrollment') {
    const result = await DansshipAPI.participationAdmin.quoteEnrollment(source.eventId, source.payload);

    return result.ok
      ? {
          ok: true as const,
          summary: {
            chargesMoney: result.data.charges_money,
            total: result.data.total,
            discountPercent: result.data.discount_percent,
            deposit: result.data.deposit,
            balance: result.data.balance,
          },
          lines: result.data.lines,
          totals: null,
        }
      : { ok: false as const, error: result.error };
  }

  const result = await DansshipAPI.participation.quoteSignup(source.slug, source.payload);

  if (!result.ok) {
    return { ok: false as const, error: result.error };
  }

  const payNow = result.data.totals?.amount_to_charge ?? result.data.total;

  return {
    ok: true as const,
    summary: {
      chargesMoney: result.data.charges_money,
      total: result.data.total,
      discountPercent: null,
      deposit: payNow,
      balance: Math.max(0, result.data.total - payNow),
    },
    lines: result.data.lines,
    totals: result.data.totals,
  };
}

/** Quote state for a form: call `quote(source)` whenever the choice changes. */
export const useSignupQuote = () => {
  const [summary, setSummary] = useState<SignupQuoteSummary | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isQuoting, setIsQuoting] = useState(false);

  const quote = useCallback(async (source: SignupQuoteSource) => {
    setIsQuoting(true);

    try {
      const result = await fetchSignupQuote(source);

      setSummary(result.ok ? result.summary : null);
      setError(result.ok ? null : result.error);

      return result;
    } finally {
      setIsQuoting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSummary(null);
    setError(null);
  }, []);

  return { summary, error, isQuoting, quote, reset };
};
