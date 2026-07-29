import { useCallback, useEffect, useRef } from 'react';

import { useCallablePromise } from './use-callable-promise';

export const usePromise = <Result>(
  promise: () => Promise<Result>,
  enabled: boolean = true,
  deps: ReadonlyArray<unknown> = [],
) => {
  const promiseRef = useRef(promise);
  promiseRef.current = promise;

  const stablePromise = useCallback(() => promiseRef.current(), []);
  const { response, isLoading, error, call } = useCallablePromise<Result>(stablePromise);

  useEffect(() => {
    if (enabled) {
      void call();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, call, ...deps]);

  return {
    response,
    isLoading,
    error,
    reFetch: call,
  };
};
