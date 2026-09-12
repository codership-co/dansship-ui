const DEFAULT_PUT_ATTEMPTS = 2;
const DEFAULT_FLOW_ATTEMPTS = 2;

function wait(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

function isRetryablePutFailure(error: unknown, status?: number) {
  if (typeof status === 'number') {
    return status === 408 || status === 429 || status >= 500;
  }

  if (error instanceof TypeError) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error ?? '');

  return /Failed to fetch|NetworkError|Load failed|network error|The Internet connection appears to be offline/i.test(
    message,
  );
}

export async function putFileToPresignedUrl(
  file: File,
  uploadUrl: string,
  options?: { contentType?: string; attempts?: number },
) {
  const attempts = options?.attempts ?? DEFAULT_PUT_ATTEMPTS;
  const contentType = options?.contentType ?? file.type;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    let status: number | undefined;

    try {
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: file,
      });

      if (uploadResponse.ok) {
        return;
      }

      status = uploadResponse.status;
      lastError = new Error(`Failed to upload file (${status})`);
    } catch (error) {
      lastError = error;
    }

    if (attempt >= attempts || !isRetryablePutFailure(lastError, status)) {
      throw lastError instanceof Error ? lastError : new Error('Failed to upload file');
    }

    await wait(300 * attempt);
  }
}

type PresignedUploadTarget = {
  upload_url?: string;
  file_key?: string;
};

export async function uploadFileWithPresignedRetry<T>(
  file: File,
  requestUpload: () => Promise<PresignedUploadTarget | null | undefined>,
  confirm: (fileKey: string) => Promise<T>,
) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= DEFAULT_FLOW_ATTEMPTS; attempt += 1) {
    try {
      const data = await requestUpload();

      if (!data?.upload_url || !data.file_key) {
        throw new Error('Failed to get upload url');
      }

      await putFileToPresignedUrl(file, data.upload_url, { contentType: file.type });

      return await confirm(data.file_key);
    } catch (error) {
      lastError = error;

      if (attempt >= DEFAULT_FLOW_ATTEMPTS) {
        break;
      }

      await wait(400 * attempt);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to upload file');
}
