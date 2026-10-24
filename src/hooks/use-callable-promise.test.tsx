import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useCallablePromise } from './use-callable-promise';

import { DansshipTransportError } from '@core/api';

describe('useCallablePromise', () => {
  it('ignores an older response once a newer call has started', async () => {
    let resolveFirst: ((value: string) => void) | undefined;
    let resolveSecond: ((value: string) => void) | undefined;
    const promise = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSecond = resolve;
          }),
      );
    const { result } = renderHook(() => useCallablePromise(promise));

    let first: Promise<string> | undefined;
    let second: Promise<string> | undefined;

    act(() => {
      first = result.current.call();
      second = result.current.call();
    });
    await act(async () => {
      resolveSecond?.('newer');
      await second;
    });
    await act(async () => {
      resolveFirst?.('older');
      await first;
    });

    expect(result.current.response).toBe('newer');
    expect(result.current.isLoading).toBe(false);
  });

  it('keeps loading while any call is still in flight', async () => {
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;
    const promise = vi
      .fn<() => Promise<string>>()
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = () => resolve('a');
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveSecond = () => resolve('b');
          }),
      );
    const { result } = renderHook(() => useCallablePromise(promise));

    act(() => {
      void result.current.call();
      void result.current.call();
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveFirst?.();
      await Promise.resolve();
    });
    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSecond?.();
      await Promise.resolve();
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.response).toBe('b');
  });

  it('does not write state after unmount', async () => {
    let resolveCall: ((value: string) => void) | undefined;
    const { result, unmount } = renderHook(() =>
      useCallablePromise(
        () =>
          new Promise<string>(resolve => {
            resolveCall = resolve;
          }),
      ),
    );

    let pending: Promise<string> | undefined;

    act(() => {
      pending = result.current.call();
    });
    unmount();
    await act(async () => {
      resolveCall?.('late');
      await pending;
    });

    expect(result.current.response).toBeNull();
  });

  it('does not surface an aborted request as an error', async () => {
    const { result } = renderHook(() =>
      useCallablePromise(() =>
        Promise.reject(
          new DansshipTransportError('aborted', 'GET', '/classes', new DOMException('aborted', 'AbortError')),
        ),
      ),
    );

    await act(async () => {
      await result.current.call().catch(() => undefined);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
