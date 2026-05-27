export async function loggingMiddleware({ request }, next) {
  const url = new URL(request.url);
  // eslint-disable-next-line no-console
  console.log(`Starting navigation: ${url.pathname}${url.search}`);
  const start = performance.now();
  await next();
  const duration = performance.now() - start;
  // eslint-disable-next-line no-console
  console.log(`Navigation completed in ${duration}ms`);
}
