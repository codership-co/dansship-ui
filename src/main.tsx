// Sentry must initialize before any other app imports.
// eslint-disable-next-line import/order -- instrument sidecar must run first
import './instrument';

import { reactErrorHandler } from '@sentry/react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

import { RootLoader } from '@components/loaders/root-loader';
import { Error404 } from '@components/svg';
import '@core/i18n';
import { Router } from '@core/router';
import '@core/styles';
import { isDynamicImportError, listenForStaleChunkLoads, reloadForStaleChunk } from '@helpers';

listenForStaleChunkLoads();

function AppErrorFallback({ error }: FallbackProps) {
  const staleChunk = isDynamicImportError(error);

  useEffect(() => {
    if (staleChunk) {
      reloadForStaleChunk();
    }
  }, [staleChunk]);

  if (staleChunk) {
    return <RootLoader />;
  }

  return <Error404 />;
}

createRoot(document.getElementById('root')!, {
  onUncaughtError: reactErrorHandler(),
  onCaughtError: reactErrorHandler(),
  onRecoverableError: reactErrorHandler(),
}).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={AppErrorFallback}>
      <Router />
    </ErrorBoundary>
    <Analytics />
    <SpeedInsights />
  </StrictMode>,
);
