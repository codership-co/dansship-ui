import { Outlet, useFetchers, useNavigation } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { Footer, Navbar } from '@components/navigation';

export const RootLayout = () => {
  const navigation = useNavigation();
  const fetchers = useFetchers();

  const isNavigating = navigation.state === 'loading';
  const isFetching = fetchers.some(f => f.state === 'loading');
  const isLoading = isNavigating || isFetching;

  return (
    <section className='app-soft-bg min-h-screen grid grid-rows-[auto_1fr_auto]'>
      <Navbar />
      <section className='h-full'>{isLoading ? <SpinnerLoader /> : <Outlet />}</section>
      <Footer />
    </section>
  );
};
