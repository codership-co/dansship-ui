import { Outlet, useLocation, useNavigation } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { Footer, Navbar } from '@components/navigation';
import { SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { useRouterLoading } from '@hooks';

const SecurityOutlet = SecurityGuard(Outlet);

export const RouterPageLayout = () => {
  const { ready } = useAuth();
  const { pathname } = useLocation();
  const { location } = useNavigation();
  const isRouterLoading = useRouterLoading();

  return (
    <section className='relative min-h-dvh grid grid-rows-[1fr_auto]'>
      {pathname !== PageURLS.home && (
        <img
          src='/assets/images/bg-girl.png'
          alt='Dansship'
          className='pointer-events-none select-none fixed bottom-0 right-0 m-8 w-[15vw] min-w-40 max-w-70 hidden lg:block -z-100'
        />
      )}
      <Navbar />
      <section className='h-full'>
        {(!ready || isRouterLoading) && !location?.pathname.startsWith('/auth') ? (
          <SpinnerLoader />
        ) : (
          <SecurityOutlet />
        )}
      </section>
      <Footer />
    </section>
  );
};
