import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { usePromise } from './use-promise';

import { resetPageLifecycleForTests, startPageLifecycle } from '@core/page-lifecycle';

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function resumeAfter(ms: number) {
  vi.setSystemTime(Date.now());
  setVisibility('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  vi.setSystemTime(Date.now() + ms);
  setVisibility('visible');
  document.dispatchEvent(new Event('visibilitychange'));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(400);
  });
}

describe('usePromise', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility('visible');
    startPageLifecycle();
  });

  afterEach(() => {
    resetPageLifecycleForTests();
    vi.useRealTimers();
  });

  it('does not refetch on resume unless asked', async () => {
    const promise = vi.fn<() => Promise<string>>().mockResolvedValue('ok');
    const { result } = renderHook(() => usePromise(promise));

    await flush();
    expect(result.current.response).toBe('ok');
    await resumeAfter(20_000);

    expect(promise).toHaveBeenCalledTimes(1);
  });

  it('revalidates after the stale window without turning loading back on', async () => {
    let resolveNext: ((value: string) => void) | undefined;
    const promise = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('ok')
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveNext = resolve;
          }),
      );
    const { result } = renderHook(() => usePromise(promise, true, [], { revalidateOnResume: { staleAfterMs: 1_000 } }));

    await flush();
    expect(result.current.response).toBe('ok');
    await resumeAfter(100);
    expect(promise).toHaveBeenCalledTimes(1);

    await resumeAfter(1_500);
    expect(promise).toHaveBeenCalledTimes(2);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.response).toBe('ok');

    await act(async () => {
      resolveNext?.('fresh');
      await Promise.resolve();
    });

    expect(result.current.response).toBe('fresh');
    expect(result.current.isLoading).toBe(false);
  });

  it('keeps the previous response when revalidation fails', async () => {
    const promise = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce('ok')
      .mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => usePromise(promise, true, [], { revalidateOnResume: true }));

    await flush();
    expect(result.current.response).toBe('ok');
    await resumeAfter(1);

    expect(result.current.response).toBe('ok');
    expect(result.current.error).toBeNull();
  });
});
