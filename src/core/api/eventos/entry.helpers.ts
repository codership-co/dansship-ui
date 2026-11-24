import { DansshipAPIError } from '../dansship.error';

import type { MyParticipationRow } from './participation.models';

/** Link / pass errors after which polling stops: the page shows a final message. */
export const TERMINAL_ENTRY_ERRORS = new Set([
  'ENTRY_LINK_INVALID',
  'ENTRY_LINK_REVOKED',
  'ENTRY_LINK_EXPIRED',
  'ENTRY_PERSON_NOT_FOUND',
]);

export function entryErrorCode(error: unknown): string | null {
  return error instanceof DansshipAPIError ? (error.body.error_code ?? null) : null;
}

export function entryErrorReason(error: unknown): string | null {
  if (!(error instanceof DansshipAPIError)) {
    return null;
  }

  const details: unknown = error.body.details;

  if (details && typeof details === 'object' && !Array.isArray(details) && 'reason' in details) {
    return String((details as { reason: unknown }).reason);
  }

  return null;
}

/**
 * Milliseconds the phone's clock is ahead of the server. The ring counts down in server time,
 * so a phone with a wrong clock still shows the right progress.
 */
export function clockSkewMs(serverTime: string, receivedAt: number): number {
  return receivedAt - new Date(serverTime).getTime();
}

/** Fraction (1 → 0) of the current code's life left, from server time. */
export function codeLifeLeft(refreshAt: string, periodSeconds: number, nowMs: number, skewMs: number): number {
  const remaining = new Date(refreshAt).getTime() - (nowMs - skewMs);
  const total = periodSeconds * 1000;

  if (total <= 0) {
    return 0;
  }

  return Math.min(1, Math.max(0, remaining / total));
}

/** "Ver QR" / "Ver mi entrada" only while the person has an active pass (payment approved). */
export function canOpenEntry(row: Pick<MyParticipationRow, 'has_entry_pass' | 'person_id'>): boolean {
  return Boolean(row.has_entry_pass && row.person_id);
}

export type EntryHistoryState = 'used' | 'not_used' | 'performed' | 'approved' | null;

/** History line of a participation row: "Usada", "No usada", "Te presentaste", "Inscripción aprobada". */
export function entryHistoryState(
  row: Pick<MyParticipationRow, 'kind' | 'status' | 'entered_at' | 'issues_entry_qr'>,
): EntryHistoryState {
  if (!row.issues_entry_qr) {
    return null;
  }

  if (row.kind === 'ticket') {
    if (row.status !== 'confirmed') {
      return null;
    }

    return row.entered_at ? 'used' : 'not_used';
  }

  if (row.status !== 'approved') {
    return null;
  }

  return row.entered_at ? 'performed' : 'approved';
}

const SCAN_REASONS = new Set([
  'unknown',
  'expired',
  'other_event',
  'payment_in_review',
  'registration_in_review',
  'not_holding',
  'not_enterable',
  'minor_enters_with_adult',
]);

/** i18n key of an INVÁLIDO / cannot-enter reason. */
export function entryReasonKey(reason: string | null | undefined): string {
  return `eventos:entry.reasons.${reason && SCAN_REASONS.has(reason) ? reason : 'not_enterable'}`;
}
