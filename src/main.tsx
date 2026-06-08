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
    <ErrorBoundary fallback={<span>Error</span>}>
      <AuthProvider>
        <FeatureFlagsProvider>
          <Router />
          <Toaster />
        </FeatureFlagsProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
