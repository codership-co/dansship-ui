export class HttpClientError extends Error {
  constructor(
    readonly status: number,
    readonly message: string = '[HttpClientError]: Unexpected error occurred',
    readonly error?: unknown,
  ) {
    super(message);

    if (error instanceof Error) {
      this.message = `[HttpClientError]: ${error.message}`;
      this.stack = error.stack ?? '';
    }
  }
}
