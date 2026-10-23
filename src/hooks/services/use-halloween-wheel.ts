import { usePromise } from '../use-promise';

import { DansshipAPI } from '@core/api';

export const useHalloweenWheel = () => {
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.halloweenAdmin.config());

  return {
    config: response?.ok ? response.data : null,
    configError: response && !response.ok ? response.error : null,
    isLoading,
    reFetch,
  };
};
