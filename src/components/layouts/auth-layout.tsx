import { Outlet, useNavigation } from 'react-router';

import { RootLoader } from '@components/loaders';
import { SecurityGuard, useAuth } from '@contexts';
import { useRouterLoading, useScrollToTop } from '@hooks';

const SecurityOutlet = SecurityGuard(Outlet);

export const AuthLayout = () => {
  const { ready } = useAuth();
  const { location } = useNavigation();
  const isRouterLoading = useRouterLoading();
  useScrollToTop();

  if ((!ready || isRouterLoading) && !location?.pathname.includes('/auth')) {
    return <RootLoader />;
  }

  return (
    <section className='relative min-h-dvh grid grid-rows-[1fr]'>
      <SecurityOutlet />
    </section>
  );
};
