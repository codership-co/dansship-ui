// Sentry must initialize before any other app imports.
// eslint-disable-next-line import/order -- instrument sidecar must run first
import './instrument';

import { reactErrorHandler } from '@sentry/react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import { Error404 } from '@components/svg';
import '@core/i18n';
import { Router } from '@core/router';
import '@core/styles';

createRoot(document.getElementById('root')!, {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <ErrorBoundary fallback={<Error404 />}>
      <Router />
    </ErrorBoundary>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
