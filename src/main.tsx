import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { Toaster } from '@components/ui';
import { AuthProvider, FeatureFlagsProvider } from '@contexts';
import '@core/i18n';
import { Router } from '@core/router';
import '@core/styles';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ErrorBoundary fallback={<span>Error</span>}>
        <FeatureFlagsProvider>
          <Router />
          <Toaster />
          <Analytics />
          <SpeedInsights />
        </FeatureFlagsProvider>
      </ErrorBoundary>
    </AuthProvider>
  </StrictMode>,
);
