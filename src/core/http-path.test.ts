import { describe, expect, it } from 'vitest';

import { toPathTemplate } from './http-path';

describe('toPathTemplate', () => {
  it('replaces uuids and numeric segments so events group by route', () => {
    expect(toPathTemplate('/payments/intents/550e8400-e29b-41d4-a716-446655440000')).toBe('/payments/intents/:id');
    expect(toPathTemplate('/bookings/42/cancel')).toBe('/bookings/:id/cancel');
  });

  it('drops the query string and keeps static paths', () => {
    expect(toPathTemplate('/onboarding/status?step=profile')).toBe('/onboarding/status');
    expect(toPathTemplate('/events/collaborations')).toBe('/events/collaborations');
  });

  it('uses a stable label when the path is empty', () => {
    expect(toPathTemplate('')).toBe('unknown');
    expect(toPathTemplate('   ')).toBe('unknown');
  });
});
