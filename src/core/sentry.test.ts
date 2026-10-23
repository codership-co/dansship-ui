import { RequestState } from 'polpo-http-client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DANSSHIP_ERROR_CATEGORY,
  DANSSHIP_ERROR_CODE,
  DansshipAPIError,
  DansshipTransportError,
  logger,
} from './api/dansship.error';
import { captureUnexpectedException } from './sentry';

const sentry = vi.hoisted(() => {
  const scope = {
    setLevel: vi.fn(),
    setFingerprint: vi.fn(),
    setTag: vi.fn(),
    setExtras: vi.fn(),
  };

  return {
    scope,
    addBreadcrumb: vi.fn(),
    captureMessage: vi.fn(),
    captureException: vi.fn(),
    withScope: (callback: (next: typeof scope) => void) => {
      callback(scope);
    },
  };
});

vi.mock('@sentry/react', () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: sentry.addBreadcrumb,
  withScope: sentry.withScope,
  captureException: sentry.captureException,
  captureMessage: sentry.captureMessage,
  startSpan: vi.fn(),
}));

describe('captureUnexpectedException transport policy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports a network failure as a warning grouped by method and path', () => {
    const cause = new TypeError('Failed to fetch');

    captureUnexpectedException(
      new DansshipTransportError('network', 'GET', '/onboarding/status/550e8400-e29b-41d4-a716-446655440000', cause),
      { tags: { flow: 'onboarding.load' } },
    );

    expect(sentry.captureMessage).toHaveBeenCalledWith('HTTP transport failure');
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.scope.setFingerprint).toHaveBeenCalledWith(['http-transport', 'GET', '/onboarding/status/:id']);
    expect(sentry.scope.setTag).toHaveBeenCalledWith('transport.kind', 'network');
    expect(sentry.scope.setTag).toHaveBeenCalledWith('flow', 'onboarding.load');
    expect(sentry.scope.setExtras).toHaveBeenCalledWith(expect.objectContaining({ 'cause.name': 'TypeError' }));
  });

  it('keeps aborted and offline failures as breadcrumbs', () => {
    captureUnexpectedException(
      new DansshipTransportError('aborted', 'GET', '/onboarding/status', new DOMException('', 'AbortError')),
    );
    captureUnexpectedException(new DansshipTransportError('offline', 'GET', '/classes', new TypeError('Load failed')));

    expect(sentry.captureMessage).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
    expect(sentry.addBreadcrumb).toHaveBeenCalledTimes(2);
  });
});

describe('logger fingerprints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups API errors by method, path, status, and error code', async () => {
    const error = new DansshipAPIError(
      {
        category: DANSSHIP_ERROR_CATEGORY.BUSINESS_RULE_VIOLATION,
        error_code: DANSSHIP_ERROR_CODE.METHOD_NOT_ALLOWED,
        message: 'Method not allowed',
        status: 405,
        timestamp: new Date(0).toISOString(),
        path: '/payments/intents/',
        details: { next_action: '', resend_verification_endpoint: '' },
        request_id: null,
        trace_id: null,
      },
      405,
      'Method not allowed',
    );

    await logger({
      apiName: 'DANSSHIP',
      buildURL: new URL('https://api.dansship.com/payments/intents/'),
      request: { method: 'GET' },
      urlParams: {
        url: undefined,
        baseURL: 'https://api.dansship.com',
        path: '/payments/intents/',
        params: undefined,
      },
      state: RequestState.REJECTED,
      response: { status: 405, error },
    });

    expect(sentry.scope.setFingerprint).toHaveBeenCalledWith([
      'api-error',
      'GET',
      '/payments/intents/',
      '405',
      DANSSHIP_ERROR_CODE.METHOD_NOT_ALLOWED,
    ]);
    expect(sentry.captureException).toHaveBeenCalledWith(error);
  });
});
