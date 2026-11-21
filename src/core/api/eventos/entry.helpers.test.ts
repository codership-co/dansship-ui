import { describe, expect, it } from 'vitest';

import { DansshipAPIError } from '../dansship.error';

import {
  canOpenEntry,
  clockSkewMs,
  codeLifeLeft,
  entryErrorCode,
  entryErrorReason,
  entryHistoryState,
  entryReasonKey,
} from './entry.helpers';

function apiError(code: string, details?: unknown) {
  return new DansshipAPIError({ error_code: code, details } as never, 409);
}

describe('entry helpers', () => {
  it('counts the ring down in server time whatever the phone clock says', () => {
    const server = '2026-12-12T21:00:00.000Z';
    const phoneAhead = new Date(server).getTime() + 60_000;
    const skew = clockSkewMs(server, phoneAhead);

    expect(skew).toBe(60_000);
    expect(codeLifeLeft('2026-12-12T21:00:10.000Z', 10, phoneAhead, skew)).toBe(1);
    expect(codeLifeLeft('2026-12-12T21:00:10.000Z', 10, phoneAhead + 5_000, skew)).toBeCloseTo(0.5);
    expect(codeLifeLeft('2026-12-12T21:00:10.000Z', 10, phoneAhead + 20_000, skew)).toBe(0);
  });

  it('opens the QR only with an active pass', () => {
    expect(canOpenEntry({ has_entry_pass: true, person_id: 'p1' })).toBe(true);
    expect(canOpenEntry({ has_entry_pass: false, person_id: 'p1' })).toBe(false);
    expect(canOpenEntry({ has_entry_pass: true, person_id: null })).toBe(false);
  });

  it('maps history states', () => {
    const base = { issues_entry_qr: true, entered_at: null } as const;

    expect(
      entryHistoryState({ ...base, kind: 'ticket', status: 'confirmed', entered_at: '2026-12-12T21:00:00Z' }),
    ).toBe('used');
    expect(entryHistoryState({ ...base, kind: 'ticket', status: 'confirmed' })).toBe('not_used');
    expect(entryHistoryState({ ...base, kind: 'signup', status: 'approved', entered_at: '2026-12-12T21:00:00Z' })).toBe(
      'performed',
    );
    expect(entryHistoryState({ ...base, kind: 'signup', status: 'approved' })).toBe('approved');
    expect(entryHistoryState({ ...base, kind: 'ticket', status: 'payment_rejected' })).toBeNull();
    expect(entryHistoryState({ ...base, issues_entry_qr: false, kind: 'ticket', status: 'confirmed' })).toBeNull();
  });

  it('reads error codes and reasons', () => {
    expect(entryErrorCode(apiError('ENTRY_LINK_REVOKED'))).toBe('ENTRY_LINK_REVOKED');
    expect(entryErrorCode(new Error('x'))).toBeNull();
    expect(entryErrorReason(apiError('ENTRY_NOT_ENTERABLE', { reason: 'payment_in_review' }))).toBe(
      'payment_in_review',
    );
    expect(entryErrorReason(apiError('ENTRY_NOT_ENTERABLE'))).toBeNull();
    expect(entryReasonKey('expired')).toBe('eventos:entry.reasons.expired');
    expect(entryReasonKey('weird')).toBe('eventos:entry.reasons.not_enterable');
  });
});
