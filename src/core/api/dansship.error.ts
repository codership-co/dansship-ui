import { HttpClientError } from 'polpo-http-client';

export type DansshipAPIErrorCategory =
  | 'AUTH'
  | 'PERMISSION'
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'SERVER'
  | 'UNKNOWN'
  | (string & {});

export interface DansshipAPIResponseError {
  type: string;
  code: string;
  message?: string;
  error?: Partial<{
    detail: string;
    error_code: string;
    message: string;
    code: string;
    category: DansshipAPIErrorCategory;
    path: string;
    timestamp: string;
    details: string;
  }>;
  detail?: string;
}

export interface NormalizedError {
  status: number;
  message: string;
  errorCode?: string;
  category?: DansshipAPIErrorCategory;
  details?: string;
  legacyDetail?: string;
  detail?: string;
  path?: string;
  timestamp?: string;
}

export class DansshipAPIError extends HttpClientError<DansshipAPIResponseError> {
  normalizedError: NormalizedError | null = null;

  constructor(
    readonly body: DansshipAPIResponseError,
    readonly status: number,
    readonly message: string = 'Unexpected error occurred',
    readonly error?: unknown,
  ) {
    super(body, status, `[DansshipAPIError]: ${message}`, error);

    if (error instanceof Error) {
      this.stack = error.stack ?? '';
      this.normalizedError = null;
    } else if (typeof error === 'object') {
      this.normalizedError = error as NormalizedError;
    }
  }
}
