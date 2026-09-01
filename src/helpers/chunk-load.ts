const CHUNK_RELOAD_KEY = 'dansship:chunk-reload';
const CHUNK_RELOAD_WINDOW_MS = 10_000;

export function isDynamicImportError(error: unknown): boolean {
  const message =
    error instanceof Error ? `${error.name} ${error.message}` : typeof error === 'string' ? error : String(error ?? '');

  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\w-]+ failed|Unable to preload CSS/i.test(
    message,
  );
}

export function reloadForStaleChunk(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? 0);

  if (lastReloadAt && Date.now() - lastReloadAt < CHUNK_RELOAD_WINDOW_MS) {
    return false;
  }

  sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  window.location.reload();

  return true;
}

export async function importWithStaleChunkRecovery<T>(importer: () => Promise<T>): Promise<T> {
  try {
    return await importer();
  } catch (error) {
    if (isDynamicImportError(error) && reloadForStaleChunk()) {
      return new Promise<T>(() => {
        /* Reload replaces this document. */
      });
    }

    throw error;
  }
}

export function listenForStaleChunkLoads() {
  window.addEventListener('vite:preloadError', event => {
    event.preventDefault();
    reloadForStaleChunk();
  });
}
