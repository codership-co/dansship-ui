import { Outlet, useFetchers, useNavigation } from 'react-router';

import { Footer, Navbar } from '@components/navigation';

export const RootLayout = () => {
  const navigation = useNavigation();
  const fetchers = useFetchers();

  // 1. Check if traditional page navigation is loading
  const isNavigating = navigation.state === 'loading';

  // 2. Check if fetchers are running background tasks
  const isFetching = fetchers.some(f => f.state === 'loading');

  const isLoading = isNavigating || isFetching;

  return (
    <section className='min-h-screen flex flex-col'>
      <Navbar />
      <section className='flex-1 app-soft-bg'>
        {/* This will show instantly on page refresh, no more blank screen! */}
        {isLoading ? <div>App is fetching data...</div> : <Outlet />}
      </section>
      <Footer />
    </section>
  );
};
