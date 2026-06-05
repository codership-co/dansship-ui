import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { Toaster } from '@components/ui';
import { AuthProvider } from '@contexts';
import '@core/i18n';
import { Router } from '@core/router';
import '@core/styles';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<span>Error</span>}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
