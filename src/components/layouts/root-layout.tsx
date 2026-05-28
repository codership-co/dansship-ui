import { Outlet, useFetchers, useNavigation } from 'react-router';

import { Navbar } from '@components/navbar';

export const RootLayout = () => {
  const navigation = useNavigation();
  const fetchers = useFetchers();

  // 1. Check if traditional page navigation is loading
  const isNavigating = navigation.state === 'loading';

  // 2. Check if fetchers are running background tasks
  const isFetching = fetchers.some(f => f.state === 'loading');

  const isLoading = isNavigating || isFetching;

  return (
    <section>
      <Navbar />

      {/* This will show instantly on page refresh, no more blank screen! */}
      {isLoading ? <div>App is fetching data...</div> : <Outlet />}
    </section>
  );
};
