export type HttpClientErrorCategory =
  | 'AUTH'
  | 'PERMISSION'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'SERVER'
  | 'UNKNOWN'
  | (string & {});

export interface HttpClientResponseError {
  type: string;
  code: string;
  message?: string;
  error?: Partial<{
    detail: string;
    error_code: string;
    message: string;
    code: string;
    category: HttpClientErrorCategory;
    path: string;
    timestamp: string;
    details: string;
  }>;
  detail?: string;
}

export interface NormalizedError {
  status: number;
  message: string;
  errorCode: string;
  category: HttpClientErrorCategory;
  details: string;
  legacyDetail: string;
  detail: string;
  path: string;
  timestamp: string;
}

export class HttpClientError extends Error {
  normalizedError: NormalizedError | null;

  constructor(
    readonly status: number,
    readonly message: string = '[HttpClientError]: Unexpected error occurred',
    readonly error?: unknown,
  ) {
    super(`[HttpClientError]: ${message}`);

    if (error instanceof Error) {
      this.message = `[HttpClientError]: ${error.message}`;
      this.stack = error.stack ?? '';
      this.normalizedError = null;
    } else if (typeof error === 'object') {
      this.normalizedError = error as NormalizedError;
    }
  }
}
