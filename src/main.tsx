import '@core/i18n';
import { Router } from '@core/router';
import '@core/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<span>Error</span>}>
      <Router />
    </ErrorBoundary>
  </StrictMode>,
);
