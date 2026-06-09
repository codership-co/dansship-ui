import { useCallback, useState } from 'react';

export const useCallablePromise = <Result, Args extends Array<unknown> = []>(
  promise: (...args: Args) => Promise<Result>,
) => {
  const [data, setData] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const call = useCallback(
    async (...args: Args): Promise<Result> => {
      try {
        setIsLoading(true);
        const response = await promise(...args);
        setIsLoading(false);
        setData(response);
        setError(null);

        return response;
      } catch (error) {
        setIsLoading(false);
        setError(error as Error);
        throw error;
      }
    },
    [promise],
  );

  return {
    response: data,
    isLoading,
    error,
    call,
  };
};
