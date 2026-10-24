import { useCallback, useEffect, useRef } from 'react';

import { useCallablePromise } from './use-callable-promise';
import { usePageResume } from './use-page-resume';

import { whenSessionSettled } from '@core/api/session-coordinator';

export type RevalidateOnResume = boolean | { staleAfterMs: number };

export interface UsePromiseOptions {
  revalidateOnResume?: RevalidateOnResume;
}

export const RESUME_REVALIDATE: UsePromiseOptions = { revalidateOnResume: { staleAfterMs: 15_000 } };

function staleAfterMs(policy: RevalidateOnResume | undefined): number | null {
  if (!policy) {
    return null;
  }

  return policy === true ? 0 : policy.staleAfterMs;
}

export const usePromise = <Result>(
  promise: () => Promise<Result>,
  enabled: boolean = true,
  deps: ReadonlyArray<unknown> = [],
  options?: UsePromiseOptions,
) => {
  const promiseRef = useRef(promise);
  const enabledRef = useRef(enabled);
  const optionsRef = useRef(options);
  const fetchedAtRef = useRef(0);

  promiseRef.current = promise;
  enabledRef.current = enabled;
  optionsRef.current = options;

  const stablePromise = useCallback(() => promiseRef.current(), []);
  const { response, isLoading, error, call, revalidate } = useCallablePromise<Result>(stablePromise);

  const run = useCallback(async () => {
    const result = await call();

    fetchedAtRef.current = Date.now();

    return result;
  }, [call]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void run().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, run, ...deps]);

  usePageResume(event => {
    const staleAfter = staleAfterMs(optionsRef.current?.revalidateOnResume);

    if (!enabledRef.current || staleAfter === null) {
      return;
    }

    const fresh = event.reason !== 'online' && Date.now() - fetchedAtRef.current < staleAfter;

    if (fresh) {
      return;
    }

    void (async () => {
      await whenSessionSettled();

      try {
        await revalidate();
        fetchedAtRef.current = Date.now();
      } catch {
        // A failed revalidation keeps the data already on screen.
      }
    })();
  });

  return {
    response,
    isLoading,
    error,
    reFetch: run,
  };
};
