import { Outlet, useNavigation } from 'react-router';

import { RootLoader } from '@components/loaders';
import { SecurityGuard, useAuth } from '@contexts';
import { useRouterLoading } from '@hooks';

const SecurityOutlet = SecurityGuard(Outlet);

export const RouterAuthLayout = () => {
  const { ready } = useAuth();
  const { location } = useNavigation();
  const isRouterLoading = useRouterLoading();

  return (
    <section className='relative min-h-dvh grid grid-rows-[1fr]'>
      {(!ready || isRouterLoading) && !location?.pathname.startsWith('/auth') ? <RootLoader /> : <SecurityOutlet />}
    </section>
  );
};
