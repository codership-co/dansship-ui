import { MiddlewareFunction } from 'react-router';

export const loggingMiddleware: MiddlewareFunction = async ({ request }, next) => {
  const url = new URL(request.url);
  // eslint-disable-next-line no-console
  console.log(`Starting navigation: ${url.pathname}${url.search}`);
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  // eslint-disable-next-line no-console
  console.log(`Navigation completed in ${duration}ms: ${url.pathname}${url.search}`);
};
