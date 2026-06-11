import { Outlet, useFetchers, useLocation, useNavigation } from 'react-router';

import { RootLoader, SpinnerLoader } from '@components/loaders';
import { Footer, Navbar } from '@components/navigation';
import { SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

const SecurityOutlet = SecurityGuard(Outlet);

export const RootLayout = () => {
  const navigation = useNavigation();
  const fetchers = useFetchers();
  const { pathname } = useLocation();
  const { ready } = useAuth();

  const isNavigating = navigation.state === 'loading';
  const isFetching = fetchers.some(f => f.state === 'loading');
  const isLoading = isNavigating || isFetching;

  if (!ready) {
    return <RootLoader />;
  }

  return (
    <section className='min-h-screen grid grid-rows-[1fr_auto]'>
      <Navbar />
      <section className={`h-full ${pathname !== PageURLS.home ? 'pt-20' : ''}`}>
        {isLoading ? <SpinnerLoader /> : <SecurityOutlet />}
      </section>
      {pathname !== PageURLS.home && (
        <img
          src='/assets/images/bg-girl.png'
          alt='Dansship'
          className='fixed bottom-0 right-0 m-8 w-[15vw] min-w-40 max-w-70 hidden lg:block'
        />
      )}
      <Footer />
    </section>
  );
};
