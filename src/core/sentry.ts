import { setUser, setTag, addBreadcrumb, withScope, captureException, startSpan } from '@sentry/react';

import { DANSSHIP_ERROR_CODE, DansshipAPIError } from './api/dansship.error';

import type { User } from './api/auth/auth.models';

const EXPECTED_BOOKING_ERROR_CODES = new Set<DANSSHIP_ERROR_CODE>([
  DANSSHIP_ERROR_CODE.BOOKING_CLASS_FULL,
  DANSSHIP_ERROR_CODE.CLASS_FULL,
  DANSSHIP_ERROR_CODE.BOOKING_TIME_OVERLAP,
  DANSSHIP_ERROR_CODE.BOOKING_CLASS_GROUP_NOT_COVERED,
  DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_ELIGIBLE,
  DANSSHIP_ERROR_CODE.WAITLIST_FULL,
]);

const EXPECTED_AUTH_ERROR_CODES = new Set<DANSSHIP_ERROR_CODE>([
  DANSSHIP_ERROR_CODE.UNAUTHORIZED,
  DANSSHIP_ERROR_CODE.EMAIL_NOT_VERIFIED,
  DANSSHIP_ERROR_CODE.TOO_MANY_REQUESTS,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_EXPIRED,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_INVALID,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_MISSING,
]);

function primaryRole(user: User): string {
  if (user.isAdmin) return 'admin';

  if (user.isInstructor || user.isCoach) return 'instructor';

  return 'student';
}

export function setSentryUser(user: User) {
  setUser({
    id: String(user.id),
    email: user.email,
  });
  setTag('user.role', primaryRole(user));
  setTag('user.roles', user.roles.join(','));
}

export function clearSentryUser() {
  setUser(null);
  setTag('user.role', '');
  setTag('user.roles', '');
}

export function addSentryBreadcrumb(
  category: string,
  message: string,
  data?: Record<string, unknown>,
  level: 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug' = 'info',
) {
  addBreadcrumb({ category, message, data, level });
}

export function isExpectedBookingError(error: unknown): boolean {
  return error instanceof DansshipAPIError && EXPECTED_BOOKING_ERROR_CODES.has(error.body.error_code);
}

export function isExpectedAuthError(error: unknown): boolean {
  return error instanceof DansshipAPIError && EXPECTED_AUTH_ERROR_CODES.has(error.body.error_code);
}

export function captureUnexpectedException(
  error: unknown,
  context?: {
    tags?: Record<string, string>;
    extras?: Record<string, unknown>;
    skipIfExpected?: 'booking' | 'auth';
  },
) {
  if (context?.skipIfExpected === 'booking' && isExpectedBookingError(error)) {
    addSentryBreadcrumb('booking.expected_error', 'Expected booking domain error', {
      error_code: error instanceof DansshipAPIError ? error.body.error_code : undefined,
    });

    return;
  }

  if (context?.skipIfExpected === 'auth' && isExpectedAuthError(error)) {
    addSentryBreadcrumb('auth.expected_error', 'Expected auth domain error', {
      error_code: error instanceof DansshipAPIError ? error.body.error_code : undefined,
    });

    return;
  }

  withScope(scope => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => scope.setTag(key, value));
    }

    if (error instanceof DansshipAPIError) {
      scope.setTag('error_code', error.body.error_code);
      scope.setTag('http.status_code', String(error.status));

      if (error.body.request_id) {
        scope.setTag('request_id', error.body.request_id);
      }

      if (error.body.trace_id) {
        scope.setTag('trace_id', error.body.trace_id);
      }
    }

    if (context?.extras) {
      scope.setExtras(context.extras);
    }

    captureException(error instanceof Error ? error : new Error(String(error)));
  });
}

export async function withSentrySpan<T>(
  name: string,
  op: string,
  attributes: Record<string, string | number | boolean | undefined>,
  fn: () => Promise<T>,
): Promise<T> {
  return startSpan(
    {
      name,
      op,
      attributes: Object.fromEntries(Object.entries(attributes).filter(([, value]) => value !== undefined)) as Record<
        string,
        string | number | boolean
      >,
    },
    fn,
  );
}
