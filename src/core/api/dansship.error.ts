import { HttpClientError, LoggerParams, RequestState } from 'polpo-http-client';

export enum DANSSHIP_ERROR_CATEGORY {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
}

export enum DANSSHIP_ERROR_CODE {
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  BOOKING_CLASS_FULL = 'BOOKING_CLASS_FULL',
  CLASS_FULL = 'CLASS_FULL',
  BOOKING_TIME_OVERLAP = 'BOOKING_TIME_OVERLAP',
}

export interface DansshipResponseError {
  category: DANSSHIP_ERROR_CATEGORY;
  error_code: DANSSHIP_ERROR_CODE;
  message: string;
  status: number;
  timestamp: string;
  path: string;
  details: {
    next_action: string;
    resend_verification_endpoint: string;
  };
  request_id: string | null;
  trace_id: string | null;
}

export class DansshipAPIError extends HttpClientError<DansshipResponseError> {
  constructor(
    readonly body: DansshipResponseError,
    readonly status: number,
    readonly message: string = 'Unexpected error occurred',
    readonly error?: unknown,
  ) {
    super(body, status, `[DansshipAPIError]: ${message}`, error);

    if (error instanceof Error) {
      this.stack = error.stack ?? '';
    }
  }
}

export async function getResponseError(response: Response, message: string) {
  const body = (await response.json()) as DansshipResponseError;

  return new DansshipAPIError(body, response.status, body.message ?? message);
}

export async function logger({ state, response }: LoggerParams) {
  if (state === RequestState.REJECTED) {
    // eslint-disable-next-line no-console
    console.error(response);
  }
}
