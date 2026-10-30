import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  beginSessionSettlement,
  refreshSession,
  resetSessionCoordinatorForTests,
  resetSessionEpoch,
  whenSessionSettled,
} from './session-coordinator';

describe('session coordinator', () => {
  afterEach(() => {
    resetSessionCoordinatorForTests();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('shares one refresh across concurrent 401s', async () => {
    let resolveRefresh: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>(resolve => {
          resolveRefresh = resolve;
        }),
    );

    vi.stubGlobal('fetch', fetchMock);

    const first = refreshSession();
    const second = refreshSession();

    resolveRefresh?.(new Response('{}', { status: 200 }));

    await expect(Promise.all([first, second])).resolves.toEqual(['refreshed', 'refreshed']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not expire the session on transport, 5xx, 429, or timeout', async () => {
    const events: Array<string> = [];
    const onExpired = () => events.push('expired');

    window.addEventListener('auth:session-expired', onExpired);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(refreshSession()).resolves.toBe('unavailable');

    resetSessionCoordinatorForTests();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    await expect(refreshSession()).resolves.toBe('unavailable');

    resetSessionCoordinatorForTests();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
    await expect(refreshSession()).resolves.toBe('unavailable');

    resetSessionCoordinatorForTests();
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        });
      }),
    );
    const pending = refreshSession();

    await vi.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toBe('unavailable');
    expect(events).toEqual([]);
    window.removeEventListener('auth:session-expired', onExpired);
  });

  it('ends the session when refresh is forbidden', async () => {
    const events: Array<string> = [];
    const onExpired = () => events.push('expired');

    window.addEventListener('auth:session-expired', onExpired);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403 })));

    await expect(refreshSession()).resolves.toBe('expired');
    expect(events).toEqual(['expired']);
    window.removeEventListener('auth:session-expired', onExpired);
  });

  it('dispatches session-expired once until the next login', async () => {
    const events: Array<string> = [];
    const onExpired = () => events.push('expired');

    window.addEventListener('auth:session-expired', onExpired);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));

    await expect(refreshSession()).resolves.toBe('expired');
    await expect(refreshSession()).resolves.toBe('expired');
    expect(events).toEqual(['expired']);

    resetSessionEpoch();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })));
    await expect(refreshSession()).resolves.toBe('refreshed');
    expect(events).toEqual(['expired']);
    window.removeEventListener('auth:session-expired', onExpired);
  });

  it('keeps data hooks waiting on an earlier session check', async () => {
    let releaseFirst: (() => void) | undefined;
    const first = new Promise<void>(resolve => {
      releaseFirst = resolve;
    });

    beginSessionSettlement(() => first);
    beginSessionSettlement(async () => undefined);

    let settled = false;
    const pending = whenSessionSettled().then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    releaseFirst?.();
    await pending;
    expect(settled).toBe(true);
  });
});
