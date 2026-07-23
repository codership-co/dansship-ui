import { Outlet } from 'react-router';

import { Toaster } from '@components/ui';
import { AuthProvider, FeatureFlagsProvider, SecurityGuard } from '@contexts';
import { useScrollToTop } from '@hooks';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useScrollToTop();

  return (
    <>
      {children}
      <Toaster richColors expand position='bottom-center' />
    </>
  );
};

const SecurityOutlet = SecurityGuard(Outlet);

export const RouterRootLayout = () => {
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
