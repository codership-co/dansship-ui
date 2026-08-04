import { useFetchers, useLocation, useNavigation } from 'react-router';

export const useRouterLoading = () => {
  const navigation = useNavigation();
  const { pathname } = useLocation();
  const fetchers = useFetchers();

  // Search/hash-only updates (e.g. admin tabs via ?tab=) must not remount the page.
  const isNavigating =
    navigation.state === 'loading' &&
    navigation.location !== null &&
    navigation.location !== undefined &&
    navigation.location.pathname !== pathname;
  const isFetching = fetchers.some(f => f.state === 'loading');

  return isNavigating || isFetching;
};
