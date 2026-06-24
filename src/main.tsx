import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { Error404 } from '@components/svg';
import '@core/i18n';
import { Router } from '@core/router';
import '@core/styles';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<Error404 />}>
      <Router />
    </ErrorBoundary>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
