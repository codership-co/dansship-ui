import { useEffect } from 'react';

import { useCallablePromise } from './use-callable-promise';

export const usePromise = <Result>(promise: () => Promise<Result>, enabled: boolean = true) => {
  const { response, isLoading, error, call } = useCallablePromise<Result>(promise, enabled);

  useEffect(() => {
    void call();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return {
    response,
    isLoading,
    error,
    reFetch: call,
  };
};
