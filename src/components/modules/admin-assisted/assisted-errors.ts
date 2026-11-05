import { DansshipAPIError } from '@core/api';

export function apiErrorCode(error: unknown): string | null {
  return error instanceof DansshipAPIError ? String(error.body.error_code) : null;
}

/** Id of the other account reported by a duplicate-email/phone 409, if any. */
export function duplicateUserId(error: unknown): string | null {
  if (!(error instanceof DansshipAPIError)) {
    return null;
  }

  const details = error.body.details as unknown;

  if (details && typeof details === 'object' && 'user_id' in details) {
    return String((details as { user_id: unknown }).user_id);
  }

  return null;
}
