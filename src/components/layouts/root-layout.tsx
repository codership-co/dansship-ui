import { Outlet, useLocation } from 'react-router';

import { RootLoader } from '@components/loaders';
import { Footer, Navbar } from '@components/navigation';
import { SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

const SecurityOutlet = SecurityGuard(Outlet);

export const RootLayout = () => {
  const { pathname } = useLocation();
  const { ready } = useAuth();

  if (!ready) {
    return <RootLoader />;
  }

  return (
    <section className='min-h-screen grid grid-rows-[1fr_auto]'>
      {pathname !== PageURLS.home && (
        <img
          src='/assets/images/bg-girl.png'
          alt='Dansship'
          className='pointer-events-none select-none fixed bottom-0 right-0 m-8 w-[15vw] min-w-40 max-w-70 hidden lg:block -z-1'
        />
      )}
      <Navbar />
      <section className={`h-full ${pathname !== PageURLS.home ? 'pt-20' : ''}`}>
        <SecurityOutlet />
      </section>
      <Footer />
    </section>
  );
};
