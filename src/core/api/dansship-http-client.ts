import {
  HttpClient,
  type HttpClientConfig,
  type HttpClientRequestConfig,
  type HttpClientResponse,
} from 'polpo-http-client';

import { DansshipAPIError, DansshipTransportError, isTimeoutFailure, toDansshipTransportError } from './dansship.error';
import { refreshSession } from './session-coordinator';

import { AUTH_SESSION_KEY } from '@core/constants';

const RETRY_DELAY_MIN_MS = 300;
const RETRY_DELAY_SPAN_MS = 501;
const GET_TIMEOUT_MS = 25_000;
const MUTATION_TIMEOUT_MS = 45_000;
const AUTH_REFRESH_SKIP_PATHS = new Set(['/auth/refresh-token', '/auth/signin', '/auth/signup', '/auth/signout']);

export const REPORT_GET_TIMEOUT_MS = 90_000;

export interface DansshipRequestConfig<Data extends object = object> extends HttpClientRequestConfig<Data> {
  timeoutMs?: number | false;
  resumable?: boolean;
}

interface InFlightEntry {
  controller: AbortController;
  startedAt: number;
  resumable: boolean;
}

interface Attempt {
  request: HttpClientRequestConfig<object>;
  signal: AbortSignal;
  close: () => void;
}

const inFlight = new Set<InFlightEntry>();

function requestMethod(config: HttpClientRequestConfig<object>): string {
  return (config.method ?? 'GET').toUpperCase();
}

function requestPath(config: HttpClientRequestConfig<object>): string {
  return config.path ?? config.url ?? '';
}

function isOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false;
}

function canRetryGet(config: HttpClientRequestConfig<object>, error: DansshipTransportError): boolean {
  return requestMethod(config) === 'GET' && error.kind === 'network' && isOnline() && !config.signal?.aborted;
}

function retryDelayMs(): number {
  return RETRY_DELAY_MIN_MS + Math.floor(Math.random() * RETRY_DELAY_SPAN_MS);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function resolveTimeout(config: DansshipRequestConfig): number | false {
  if (config.timeoutMs === false) {
    return false;
  }

  if (typeof config.timeoutMs === 'number') {
    return config.timeoutMs;
  }

  return requestMethod(config) === 'GET' ? GET_TIMEOUT_MS : MUTATION_TIMEOUT_MS;
}

function isResumable(config: DansshipRequestConfig): boolean {
  return requestMethod(config) === 'GET' && config.resumable !== false;
}

function toPolpoConfig(config: DansshipRequestConfig, signal: AbortSignal): HttpClientRequestConfig<object> {
  const request = { ...config, signal };

  delete request.timeoutMs;
  delete request.resumable;

  return request;
}

function hasSession(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(AUTH_SESSION_KEY) === '1';
}

function canRefresh(config: DansshipRequestConfig): boolean {
  return hasSession() && !AUTH_REFRESH_SKIP_PATHS.has(requestPath(config));
}

function isUnauthorizedError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: number }).status === 401 &&
    !(error instanceof DansshipTransportError)
  );
}

function isUnauthorizedResult(result: HttpClientResponse<unknown, DansshipAPIError>): boolean {
  return !result.ok && result.status === 401;
}

function linkExternalSignal(controller: AbortController, external: AbortSignal | undefined) {
  if (!external) {
    return () => undefined;
  }

  if (external.aborted) {
    controller.abort(external.reason);

    return () => undefined;
  }

  const onAbort = () => controller.abort(external.reason);

  external.addEventListener('abort', onAbort);

  return () => external.removeEventListener('abort', onAbort);
}

export function abortInFlight(options?: { startedBefore?: number }) {
  inFlight.forEach(entry => {
    if (!entry.resumable) {
      return;
    }

    if (options?.startedBefore !== undefined && entry.startedAt >= options.startedBefore) {
      return;
    }

    entry.controller.abort(new DOMException('The operation was aborted', 'AbortError'));
  });
}

export class DansshipHttpClient extends HttpClient<DansshipAPIError> {
  constructor(config: HttpClientConfig<DansshipAPIError>) {
    super(config);
  }

  override call<Response, Data extends object = object, NewResponse = Response>(
    config: DansshipRequestConfig<Data>,
    mapData?: (data: Response) => NewResponse,
  ): Promise<NewResponse> {
    const execute = (request: HttpClientRequestConfig<object>): Promise<NewResponse> => {
      if (mapData) {
        return super.call(request as HttpClientRequestConfig<Data>, mapData);
      }

      return super.call(request as HttpClientRequestConfig<Data>) as Promise<NewResponse>;
    };

    return this.runCall(config, execute);
  }

  override async callNoError<Response = void, Data extends object = object, NewResponse = Response>(
    config: DansshipRequestConfig<Data>,
    mapData?: (data: Response) => NewResponse,
  ): Promise<HttpClientResponse<NewResponse, DansshipAPIError>> {
    const execute = (
      request: HttpClientRequestConfig<object>,
    ): Promise<HttpClientResponse<NewResponse, DansshipAPIError>> => {
      if (mapData) {
        return super.callNoError(request as HttpClientRequestConfig<Data>, mapData);
      }

      return super.callNoError(request as HttpClientRequestConfig<Data>) as Promise<
        HttpClientResponse<NewResponse, DansshipAPIError>
      >;
    };

    let result = await this.invokeNoError(config, execute);

    if (isUnauthorizedResult(result) && canRefresh(config)) {
      const outcome = await refreshSession();

      if (outcome === 'refreshed') {
        result = await this.invokeNoError(config, execute);
      }
    }

    result = this.withTransportError(result, config);
    const failure = result.ok
      ? null
      : toDansshipTransportError(result.error, requestMethod(config), requestPath(config));

    if (failure && canRetryGet(config, failure)) {
      await sleep(retryDelayMs());

      if (isOnline() && !config.signal?.aborted) {
        result = this.withTransportError(await this.invokeNoError(config, execute), config);
      }
    }

    return result;
  }

  private openAttempt(config: DansshipRequestConfig): Attempt {
    const controller = new AbortController();
    const unlink = linkExternalSignal(controller, config.signal);
    const timeoutMs = resolveTimeout(config);
    const timer =
      timeoutMs === false
        ? undefined
        : setTimeout(() => {
            controller.abort(new DOMException('The operation timed out', 'TimeoutError'));
          }, timeoutMs);
    const resumable = isResumable(config);
    const entry: InFlightEntry = { controller, startedAt: Date.now(), resumable };

    if (resumable) {
      inFlight.add(entry);
    }

    let closed = false;

    return {
      request: toPolpoConfig(config, controller.signal),
      signal: controller.signal,
      close: () => {
        if (closed) {
          return;
        }

        closed = true;

        if (timer !== undefined) {
          clearTimeout(timer);
        }

        unlink();
        inFlight.delete(entry);
      },
    };
  }

  private decorate(error: unknown, signal: AbortSignal, config: DansshipRequestConfig): unknown {
    if (signal.aborted && isTimeoutFailure(signal.reason)) {
      return new DansshipTransportError('timeout', requestMethod(config), requestPath(config), error);
    }

    const transport = toDansshipTransportError(error, requestMethod(config), requestPath(config));

    return transport ?? error;
  }

  private async attempt<T>(
    config: DansshipRequestConfig,
    run: (request: HttpClientRequestConfig<object>) => Promise<T>,
    allowRefresh: boolean,
  ): Promise<T> {
    const attempt = this.openAttempt(config);

    try {
      return await run(attempt.request);
    } catch (error) {
      if (allowRefresh && isUnauthorizedError(error) && canRefresh(config)) {
        const outcome = await refreshSession();

        if (outcome === 'refreshed') {
          attempt.close();

          return this.attempt(config, run, false);
        }
      }

      throw this.decorate(error, attempt.signal, config);
    } finally {
      attempt.close();
    }
  }

  private async invokeNoError<T>(
    config: DansshipRequestConfig,
    execute: (request: HttpClientRequestConfig<object>) => Promise<HttpClientResponse<T, DansshipAPIError>>,
  ): Promise<HttpClientResponse<T, DansshipAPIError>> {
    const attempt = this.openAttempt(config);

    try {
      const result = await execute(attempt.request);

      if (attempt.signal.aborted && isTimeoutFailure(attempt.signal.reason)) {
        return {
          ok: false,
          data: null,
          status: 0,
          error: new DansshipTransportError(
            'timeout',
            requestMethod(config),
            requestPath(config),
            attempt.signal.reason,
          ) as unknown as DansshipAPIError,
        };
      }

      return result;
    } catch (error) {
      throw this.decorate(error, attempt.signal, config);
    } finally {
      attempt.close();
    }
  }

  private async runCall<T>(
    config: DansshipRequestConfig,
    run: (request: HttpClientRequestConfig<object>) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.attempt(config, run, true);
    } catch (error) {
      const transport = toDansshipTransportError(error, requestMethod(config), requestPath(config));

      if (!transport) {
        throw error;
      }

      if (!canRetryGet(config, transport)) {
        throw transport;
      }

      await sleep(retryDelayMs());

      if (!isOnline() || config.signal?.aborted) {
        throw transport;
      }

      try {
        return await this.attempt(config, run, true);
      } catch (retryError) {
        const retried = toDansshipTransportError(retryError, requestMethod(config), requestPath(config));

        if (!retried) {
          throw retryError;
        }

        throw retried;
      }
    }
  }

  private withTransportError<T>(
    result: HttpClientResponse<T, DansshipAPIError>,
    config: HttpClientRequestConfig<object>,
  ): HttpClientResponse<T, DansshipAPIError> {
    if (result.ok || result.status !== 0) {
      return result;
    }

    const transport = toDansshipTransportError(result.error, requestMethod(config), requestPath(config));

    if (!transport) {
      return result;
    }

    return {
      ok: false,
      data: null,
      status: 0,
      error: transport as unknown as DansshipAPIError,
    };
  }
}
