const UUID_SEGMENT = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_SEGMENT = /\/\d+(?=\/|$)/g;

/** Collapse ids so Sentry groups one issue per route, not per resource. */
export function toPathTemplate(path: string): string {
  const withoutQuery = path.split('?')[0] ?? path;
  const trimmed = withoutQuery.trim();

  if (!trimmed) {
    return 'unknown';
  }

  return trimmed.replace(UUID_SEGMENT, ':id').replace(NUMERIC_SEGMENT, '/:id');
}
