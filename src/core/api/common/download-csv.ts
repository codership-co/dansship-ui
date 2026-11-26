/**
 * Downloads a CSV from the API with a raw fetch: a download skips DansshipHttpClient,
 * so it does not refresh a 401 or abort on resume.
 */
export async function downloadCsvFile(path: string, filename: string, params: Record<string, string | undefined> = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();
  const response = await fetch(`${import.meta.env.VITE_DANSSHIP_API_URL}${path}${query ? `?${query}` : ''}`, {
    method: 'GET',
    credentials: 'include',
    headers: { accept: 'text/csv' },
  });

  if (!response.ok) {
    throw new Error(`CSV export failed: ${path}`);
  }

  saveBlobAs(await response.blob(), filename);
}

/** Saves a blob built in the browser (a CSV, a zip) as a download. */
export function saveBlobAs(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
