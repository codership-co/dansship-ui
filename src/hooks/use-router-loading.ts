import { useFetchers, useNavigation } from 'react-router';

export const useRouterLoading = () => {
  const navigation = useNavigation();
  const fetchers = useFetchers();

  const isNavigating = navigation.state === 'loading';
  const isFetching = fetchers.some(f => f.state === 'loading');

  return isNavigating || isFetching;
};
