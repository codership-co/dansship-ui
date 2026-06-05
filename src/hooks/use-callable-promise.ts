import { useCallback, useState } from 'react';

export const useCallablePromise = <Result, Args extends Array<unknown> = []>(
  promise: (...args: Args) => Promise<Result>,
  enabled: boolean = true,
) => {
  const [data, setData] = useState<Result>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>(null);

  const call = useCallback(
    async (...args: Args): Promise<Result> => {
      if (!enabled) return;

      try {
        setIsLoading(true);
        const response = await promise(...args);
        setData(response);
        setError(null);
      } catch (error) {
        setError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [enabled, promise],
  );

  return {
    response: data,
    isLoading,
    error,
    call,
  };
};
