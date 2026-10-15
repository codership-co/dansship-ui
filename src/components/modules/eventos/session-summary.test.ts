import { describe, expect, it } from 'vitest';

import { sessionSummaryText } from './session-summary';

import i18n from '@core/i18n';

const t = (key: string, options?: Record<string, unknown>) => String(i18n.t(key, options));

describe('sessionSummaryText', () => {
  it('returns nothing when there are no extra sessions', () => {
    expect(sessionSummaryText({ session_summary: null }, t)).toBeNull();
    expect(
      sessionSummaryText(
        { session_summary: { extra_count: 0, weekday: 5, start_time: '17:00', end_time: '19:00' } },
        t,
      ),
    ).toBeNull();
  });

  it('names the shared Saturday window', () => {
    expect(
      sessionSummaryText(
        { session_summary: { extra_count: 4, weekday: 5, start_time: '17:00', end_time: '19:00' } },
        t,
      ),
    ).toBe('Incluye 4 sesiones: sábados 5:00 pm–7:00 pm');
  });

  it('uses only the count when the times differ', () => {
    expect(
      sessionSummaryText({ session_summary: { extra_count: 3, weekday: null, start_time: null, end_time: null } }, t),
    ).toBe('Incluye 3 sesiones');
  });
});
