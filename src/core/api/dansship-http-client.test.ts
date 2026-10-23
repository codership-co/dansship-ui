import { HttpClientError } from 'polpo-http-client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DansshipHttpClient } from './dansship-http-client';
import { DansshipTransportError, toDansshipTransportError } from './dansship.error';

function client(baseURL = 'https://api.dansship.com') {
  return new DansshipHttpClient({
    apiName: 'DANSSHIP',
    baseURL,
  });
}

describe('toDansshipTransportError', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('classifies abort before offline, and leaves HTTP and chunk errors alone', () => {
    const abort = new DOMException('The operation was aborted', 'AbortError');

    expect(toDansshipTransportError(abort, 'GET', '/onboarding/status')?.kind).toBe('aborted');
    expect(toDansshipTransportError(new TypeError('Failed to fetch'), 'POST', '/bookings')?.kind).toBe('network');

    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    expect(toDansshipTransportError(new TypeError('Load failed'), 'GET', '/classes')?.kind).toBe('offline');
    expect(toDansshipTransportError(abort, 'GET', '/classes')?.kind).toBe('aborted');

    expect(
      toDansshipTransportError(new TypeError('Failed to fetch dynamically imported module'), 'GET', '/x'),
    ).toBeNull();
    expect(toDansshipTransportError(new HttpClientError(null, 400, 'bad url'), 'GET', '/x')).toBeNull();
  });
});

describe('DansshipHttpClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('maps a fetch rejection and retries a GET once', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: '1' }), { status: 200 }));

    vi.stubGlobal('fetch', fetchMock);

    const pending = client().call<{ id: string }>({ path: '/onboarding/status', method: 'GET' });

    await vi.advanceTimersByTimeAsync(800);

    await expect(pending).resolves.toEqual({ id: '1' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry a POST and keeps the method and path on the error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Load failed'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await client().callNoError({
      path: '/bookings',
      method: 'POST',
      data: { scheduled_class_id: 'class-1' },
    });

    expect(result.ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    if (!result.ok) {
      expect(result.error).toBeInstanceOf(DansshipTransportError);
      expect(result.error).toMatchObject({ kind: 'network', method: 'POST', path: '/bookings', status: 0 });
    }
  });

  it('does not retry an aborted GET', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'));

    vi.stubGlobal('fetch', fetchMock);

    const result = await client().callNoError({ path: '/onboarding/status', method: 'GET' });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    if (!result.ok) {
      expect(result.error).toMatchObject({ kind: 'aborted', method: 'GET', path: '/onboarding/status' });
    }
  });

  it('leaves client errors and stale chunk loads unchanged', async () => {
    const chunkError = new TypeError('Failed to fetch dynamically imported module');
    const fetchMock = vi.fn().mockRejectedValue(chunkError);

    vi.stubGlobal('fetch', fetchMock);

    const chunkResult = await client().callNoError({ path: '/onboarding/status', method: 'GET' });
    const invalidResult = await client('').callNoError({ method: 'GET' });

    expect(chunkResult.ok).toBe(false);
    expect(invalidResult.ok).toBe(false);

    if (!chunkResult.ok) {
      expect(chunkResult.error).toBe(chunkError);
    }

    if (!invalidResult.ok) {
      expect(invalidResult.error).toBeInstanceOf(HttpClientError);
      expect(invalidResult.status).toBe(400);
    }
  });
});
