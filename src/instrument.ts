import { init, browserTracingIntegration, replayIntegration } from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();

if (import.meta.env.PROD && dsn) {
  const apiUrl = import.meta.env.VITE_DANSSHIP_API_URL;

  init({
    dsn,
    environment: 'production',
    integrations: [
      browserTracingIntegration(),
      replayIntegration({
        // Readable UI copy for debugging; inputs stay masked by default.
        maskAllText: false,
        maskAllInputs: true,
        blockAllMedia: true,
        mask: ['.sentry-mask', '[data-sentry-mask]'],
        block: ['.sentry-block', '[data-sentry-block]'],
      }),
    ],
    tracesSampleRate: 0.1,
    tracePropagationTargets: ['localhost', apiUrl].filter(Boolean),
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
