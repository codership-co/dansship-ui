import { Outlet, useNavigation } from 'react-router';

import { RootLoader } from '@components/loaders';
import { Toaster } from '@components/ui';
import { AuthProvider, FeatureFlagsProvider, SecurityGuard, useAuth } from '@contexts';
import { useRouterLoading, useScrollToTop } from '@hooks';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { ready } = useAuth();
  const { location } = useNavigation();
  const isRouterLoading = useRouterLoading();
  useScrollToTop();

  if ((!ready || isRouterLoading) && !location?.pathname.startsWith('/auth')) {
    return <RootLoader />;
  }

  return (
    <>
      {children}
      <Toaster />
    </>
  );
};

const SecurityOutlet = SecurityGuard(Outlet);

export const RootLayout = () => {
  return (
    <AuthProvider>
      <FeatureFlagsProvider>
        <Layout>
          <SecurityOutlet />
        </Layout>
      </FeatureFlagsProvider>
    </AuthProvider>
  );
};
