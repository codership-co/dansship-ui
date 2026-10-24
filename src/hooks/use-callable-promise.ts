import { useCallback, useEffect, useRef, useState } from 'react';

import { isAbortFailure, isDansshipTransportError } from '@core/api';

function isAborted(error: unknown): boolean {
  return isAbortFailure(error) || (isDansshipTransportError(error) && error.kind === 'aborted');
}

export const useCallablePromise = <Result, Args extends Array<unknown> = []>(
  promise: (...args: Args) => Promise<Result>,
) => {
  const [data, setData] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const promiseRef = useRef(promise);
  const generationRef = useRef(0);
  const inFlightRef = useRef(0);
  const mountedRef = useRef(true);
  const hasDataRef = useRef(false);

  promiseRef.current = promise;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const invoke = useCallback(async (args: Args, background: boolean): Promise<Result> => {
    const generation = ++generationRef.current;
    const trackLoading = !(background && hasDataRef.current);

    if (trackLoading) {
      inFlightRef.current += 1;
      setIsLoading(true);
    }

    try {
      const response = await promiseRef.current(...args);

      if (!mountedRef.current || generation !== generationRef.current) {
        return response;
      }

      hasDataRef.current = response !== null;
      setData(response);
      setError(null);

      return response;
    } catch (caught) {
      if (!mountedRef.current || generation !== generationRef.current) {
        throw caught;
      }

      if (!isAborted(caught) && !(background && hasDataRef.current)) {
        setError(caught as Error);
      }

      throw caught;
    } finally {
      if (trackLoading) {
        inFlightRef.current = Math.max(0, inFlightRef.current - 1);

        if (mountedRef.current && inFlightRef.current === 0) {
          setIsLoading(false);
        }
      }
    }
  }, []);

  const call = useCallback((...args: Args) => invoke(args, false), [invoke]);
  const revalidate = useCallback((...args: Args) => invoke(args, true), [invoke]);

  return {
    response: data,
    isLoading,
    error,
    call,
    revalidate,
  };
};
