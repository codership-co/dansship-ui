import { init, browserTracingIntegration, replayIntegration } from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();

/** Third-party browser / crawler noise — not Dansship app failures. */
const IGNORE_ERRORS = [
  /webkit\.messageHandlers/i,
  /Java object is gone/i,
  /Error invoking postMessage/i,
  // CefSharp bots (often Outlook Safe Links) reject with this non-Error string.
  /Object Not Found Matching Id:\d+/i,
];

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
    ignoreErrors: IGNORE_ERRORS,
    beforeSend(event) {
      const frames = event.exception?.values?.flatMap(value => value.stacktrace?.frames ?? []) ?? [];
      const isInAppBrowserBridge = frames.some(
        frame =>
          frame.filename?.includes('iabjs://') ||
          frame.function === 'sendDataToNative' ||
          frame.function === 'sendPageHideMessage' ||
          frame.function === 'sendBeforeUnloadMessage',
      );

      if (isInAppBrowserBridge) {
        return null;
      }

      return event;
    },
    tracesSampleRate: 0.1,
    tracePropagationTargets: ['localhost', apiUrl].filter(Boolean),
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
  });
}
