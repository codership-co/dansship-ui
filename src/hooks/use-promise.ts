import { useEffect } from 'react';

import { useCallablePromise } from './use-callable-promise';

export const usePromise = <Result>(promise: () => Promise<Result>, enabled: boolean = true) => {
  const { response, isLoading, error, call } = useCallablePromise<Result>(promise);

  useEffect(() => {
    if (enabled) {
      void call();
    }
  }, [enabled, call]);

  return {
    response,
    isLoading,
    error,
    reFetch: call,
  };
};
