import { getResponseErrorMessage } from './get-response-error-message';
import { getURL, type GetUrlParams } from './get-url';
import { HttpClientError } from './http-client-error';

export type HttpClientParams = object | URLSearchParams | string;

export interface HttpClientCommonConfig {
  headers?: HeadersInit;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  mode?: RequestMode;
  cache?: RequestCache;
  credentials?: RequestCredentials;
  integrity?: string;
  keepalive?: boolean;
  priority?: RequestPriority;
  redirect?: RequestRedirect;
}

export const RequestState = {
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
} as const;

export interface LoggerParams {
  apiName: string;
  buildURL: URL;
  request: RequestInit;
  urlParams: GetUrlParams;
  state: (typeof RequestState)[keyof typeof RequestState];
  response: HttpClientResponse<unknown> | null;
}

export type Logger = (params: LoggerParams) => Promise<void>;

export interface HttpClientConfig extends HttpClientCommonConfig {
  apiName: string;
  baseURL?: string;
  getHeaders?: () => Promise<HeadersInit>;
  getLogger?: (() => Logger) | undefined;
}

export interface HttpClientRequestConfig<T extends object> extends HttpClientCommonConfig {
  url?: string;
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: BodyInit;
  signal?: AbortSignal;
  params?: HttpClientParams;
  window?: null;
  disableCache?: boolean;
  data?: T;
}

export interface HttpClientSuccessResponse<T> {
  data: T;
  status: number;
  error: null;
}

export interface HttpClientErrorResponse {
  data: null;
  status: number;
  error: string;
}

export type HttpClientResponse<Response> = HttpClientSuccessResponse<Response> | HttpClientErrorResponse;

export function getHttpClientErrorResponse(error: Error): HttpClientErrorResponse {
  if (error instanceof HttpClientError) {
    return {
      data: null,
      error: error.message,
      status: error.status,
    };
  }

  return {
    data: null,
    error: error.message,
    status: 500,
  };
}

export class HttpClient {
  private readonly httpConfig: HttpClientConfig;

  constructor(protected config: HttpClientConfig) {
    this.httpConfig = config;
  }

  protected async onRequest(requestInit: RequestInit): Promise<RequestInit> {
    let headers = requestInit.headers || {};

    if (this.httpConfig.getHeaders) {
      const newHeaders = await this.httpConfig.getHeaders();
      headers = { ...headers, ...newHeaders };
    }

    return {
      ...requestInit,
      headers,
    };
  }

  private async getRequestParams<Payload extends object = object>(_config: HttpClientRequestConfig<Payload>) {
    const { path, url, params, disableCache, data: requestData, ...config } = _config;
    const { baseURL, apiName, getLogger, ...httpConfig } = this.httpConfig;
    const urlParams: GetUrlParams = { url, baseURL, path, params };
    const buildURL = getURL(urlParams);

    const request = await this.onRequest({
      method: 'GET',
      cache: !disableCache || config.method === 'GET' ? 'force-cache' : 'no-store',
      body: requestData ? JSON.stringify(requestData) : null,
      ...httpConfig,
      ...config,
      headers: {
        ...httpConfig.headers,
        ...config.headers,
      },
    });

    return { buildURL, request, urlParams, apiName, getLogger };
  }

  private async log<Response, Payload extends object = object>(
    config: HttpClientRequestConfig<Payload>,
    state: LoggerParams['state'],
    response: HttpClientResponse<Response>,
  ) {
    const { apiName, urlParams, buildURL, request, getLogger } = await this.getRequestParams<Payload>(config);

    if (getLogger) {
      await getLogger()({ apiName, buildURL, urlParams, request, state, response });
    }
  }

  private async callOrThrow<Response, Payload extends object = object>(
    config: HttpClientRequestConfig<Payload>,
  ): Promise<HttpClientSuccessResponse<Response>> {
    const { apiName, buildURL, request } = await this.getRequestParams<Payload>(config);

    const response = await fetch(buildURL, request);

    if (!response.ok) {
      const message = await getResponseErrorMessage(
        response,
        `[${apiName}]: There was a problem fetching [${config.method ?? 'GET'}] - ${buildURL}`,
      );
      throw new HttpClientError(response.status, message);
    }

    const data = (await response.json()) as Response;

    return {
      data,
      status: response.status,
      error: null,
    };
  }

  protected async call<Response, Payload extends object = object>(
    config: HttpClientRequestConfig<Payload>,
  ): Promise<HttpClientResponse<Response>> {
    try {
      const response = await this.callOrThrow<Response, Payload>(config);
      await this.log(config, RequestState.RESOLVED, response);

      return response;
    } catch (error: unknown) {
      const errorResponse = getHttpClientErrorResponse(error as Error);
      await this.log(config, RequestState.REJECTED, errorResponse);

      return errorResponse;
    }
  }
}
