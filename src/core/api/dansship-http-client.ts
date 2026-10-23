import {
  HttpClient,
  type HttpClientConfig,
  type HttpClientRequestConfig,
  type HttpClientResponse,
} from 'polpo-http-client';

import { DansshipAPIError, toDansshipTransportError, type DansshipTransportError } from './dansship.error';

const RETRY_DELAY_MIN_MS = 300;
const RETRY_DELAY_SPAN_MS = 501;

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

export class DansshipHttpClient extends HttpClient<DansshipAPIError> {
  constructor(config: HttpClientConfig<DansshipAPIError>) {
    super(config);
  }

  override call<Response, Data extends object = object, NewResponse = Response>(
    config: HttpClientRequestConfig<Data>,
    mapData?: (data: Response) => NewResponse,
  ): Promise<NewResponse> {
    const execute = (): Promise<NewResponse> => {
      if (mapData) {
        return super.call(config, mapData);
      }

      return super.call(config) as Promise<NewResponse>;
    };

    return this.runCall(config, execute);
  }

  override async callNoError<Response = void, Data extends object = object, NewResponse = Response>(
    config: HttpClientRequestConfig<Data>,
    mapData?: (data: Response) => NewResponse,
  ): Promise<HttpClientResponse<NewResponse, DansshipAPIError>> {
    const execute = (): Promise<HttpClientResponse<NewResponse, DansshipAPIError>> => {
      if (mapData) {
        return super.callNoError(config, mapData);
      }

      return super.callNoError(config) as Promise<HttpClientResponse<NewResponse, DansshipAPIError>>;
    };

    let result = this.withTransportError(await execute(), config);
    const failure = result.ok
      ? null
      : toDansshipTransportError(result.error, requestMethod(config), requestPath(config));

    if (failure && canRetryGet(config, failure)) {
      await sleep(retryDelayMs());

      if (isOnline() && !config.signal?.aborted) {
        result = this.withTransportError(await execute(), config);
      }
    }

    return result;
  }

  private async runCall<T>(config: HttpClientRequestConfig<object>, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
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
        return await run();
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
