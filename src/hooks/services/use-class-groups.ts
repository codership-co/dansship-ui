import { usePromise } from '../use-promise';

import { DansshipAPI } from '@core/api';

export const useClassGroups = () => {
  const { response: classGroups, isLoading } = usePromise(() => DansshipAPI.inventoryAdmin.getClassGroups());

  return {
    classGroups: classGroups?.data ?? [],
    isLoading,
  };
};
