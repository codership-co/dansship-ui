import { setUser, setTag, addBreadcrumb, withScope, captureException, captureMessage, startSpan } from '@sentry/react';

import { isDynamicImportError } from '../helpers/chunk-load';

import { DANSSHIP_ERROR_CODE, DansshipAPIError, DansshipTransportError, isAbortFailure } from './api/dansship.error';
import { toPathTemplate } from './http-path';

import type { User } from './api/auth/auth.models';

const EXPECTED_BOOKING_ERROR_CODES = new Set<DANSSHIP_ERROR_CODE>([
  DANSSHIP_ERROR_CODE.BOOKING_CLASS_FULL,
  DANSSHIP_ERROR_CODE.CLASS_FULL,
  DANSSHIP_ERROR_CODE.BOOKING_TIME_OVERLAP,
  DANSSHIP_ERROR_CODE.BOOKING_CLASS_GROUP_NOT_COVERED,
  DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_ELIGIBLE,
  DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_STARTED,
  DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_EXPIRED,
  DANSSHIP_ERROR_CODE.BOOKING_LATE_JOIN_CLOSED,
  DANSSHIP_ERROR_CODE.BOOKING_INSTRUCTOR_OWN_CLASS,
  DANSSHIP_ERROR_CODE.BOOKING_INSTRUCTOR_TEACHING_OVERLAP,
  DANSSHIP_ERROR_CODE.BOOKING_CLASS_CANCELLED,
  DANSSHIP_ERROR_CODE.BOOKING_NOT_CANCELLABLE,
  DANSSHIP_ERROR_CODE.TWO_FOR_ONE_NOT_ELIGIBLE,
  DANSSHIP_ERROR_CODE.TWO_FOR_ONE_COMPANION_NOT_FOUND,
  DANSSHIP_ERROR_CODE.TWO_FOR_ONE_SELF_REFERENCE,
  DANSSHIP_ERROR_CODE.TWO_FOR_ONE_WEEK_NOT_FOUND,
  DANSSHIP_ERROR_CODE.TWO_FOR_ONE_DATE_OUTSIDE_WEEK,
  DANSSHIP_ERROR_CODE.TWO_FOR_ONE_DATE_IN_PAST,
  DANSSHIP_ERROR_CODE.TWO_FOR_ONE_WEEK_LOCKED,
]);

const EXPECTED_AUTH_ERROR_CODES = new Set<DANSSHIP_ERROR_CODE>([
  DANSSHIP_ERROR_CODE.UNAUTHORIZED,
  DANSSHIP_ERROR_CODE.EMAIL_NOT_VERIFIED,
  DANSSHIP_ERROR_CODE.TEMP_PASSWORD_EXPIRED,
  DANSSHIP_ERROR_CODE.PASSWORD_CHANGE_REQUIRED,
  DANSSHIP_ERROR_CODE.TOO_MANY_REQUESTS,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_EXPIRED,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_INVALID,
  DANSSHIP_ERROR_CODE.AUTH_TOKEN_MISSING,
  DANSSHIP_ERROR_CODE.AUTH_OTP_INVALID,
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

const TRANSPORT_FAILURE_RE =
  /Failed to fetch|NetworkError|Load failed|network error|The Internet connection appears to be offline/i;

function isBrowserOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

export function isTransportFailure(error: unknown): boolean {
  if (isDynamicImportError(error)) {
    return false;
  }

  if (error instanceof DansshipTransportError) {
    return true;
  }

  if (error instanceof DansshipAPIError && error.status > 0) {
    return false;
  }

  const message = error instanceof Error ? error.message : typeof error === 'string' ? error : '';

  return TRANSPORT_FAILURE_RE.test(message);
}

function transportKind(error: unknown): 'aborted' | 'offline' | 'network' | 'timeout' {
  if (error instanceof DansshipTransportError) {
    return error.kind;
  }

  if (isAbortFailure(error)) {
    return 'aborted';
  }

  if (isBrowserOffline()) {
    return 'offline';
  }

  return 'network';
}

function transportCause(error: unknown): unknown {
  if (error instanceof DansshipTransportError) {
    return error.cause;
  }

  return error;
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

  if (error instanceof DansshipTransportError || isAbortFailure(error) || isTransportFailure(error)) {
    const kind = transportKind(error);
    const method = error instanceof DansshipTransportError ? error.method : 'unknown';
    const pathTemplate = toPathTemplate(error instanceof DansshipTransportError ? error.path : '');

    if (kind === 'aborted' || kind === 'offline') {
      addSentryBreadcrumb(
        'http.transport',
        'Request failed before an HTTP response',
        { method, path: pathTemplate, kind },
        'warning',
      );

      return;
    }

    const cause = transportCause(error);

    withScope(scope => {
      scope.setLevel('warning');
      scope.setFingerprint(['http-transport', method, pathTemplate]);
      scope.setTag('http.method', method);
      scope.setTag('http.path', pathTemplate);
      scope.setTag('transport.kind', kind);

      if (context?.tags) {
        Object.entries(context.tags).forEach(([key, value]) => scope.setTag(key, value));
      }

      scope.setExtras({
        'cause.name': cause instanceof Error ? cause.name : typeof cause,
        'cause.message': cause instanceof Error ? cause.message : String(cause ?? ''),
        online: typeof navigator === 'undefined' ? undefined : navigator.onLine,
        visibilityState: typeof document === 'undefined' ? undefined : document.visibilityState,
        ...context?.extras,
      });

      captureMessage('HTTP transport failure');
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
