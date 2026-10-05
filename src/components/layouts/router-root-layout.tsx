import { Outlet } from 'react-router';

import { Toaster } from '@components/ui/sonner';
import { AuthProvider, FeatureFlagsProvider, SecurityGuard } from '@contexts';
import { useMetaPixelPageView, useScrollToTop } from '@hooks';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  useScrollToTop();
  useMetaPixelPageView();

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
