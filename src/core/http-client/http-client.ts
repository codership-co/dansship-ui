import { getResponseError } from './get-response-error';
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
  retries?: number;
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

type OnErrorCallback =
  | ((config: HttpClientRequestConfig<object>, response: HttpClientResponse<Response>) => Promise<void>)
  | undefined;

type MappingDataResponseFunction<Response, NewResponse extends Response = Response> = (data: Response) => NewResponse;

export class HttpClient {
  private readonly httpConfig: HttpClientConfig;
  private readonly onError: OnErrorCallback = undefined;

  constructor(
    protected config: HttpClientConfig,
    onError: OnErrorCallback = undefined,
  ) {
    this.httpConfig = config;
    this.onError = onError;
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
    const { path, url, params, disableCache, data: requestData, retries: _, ...config } = _config;
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
      throw await getResponseError(
        response,
        `[${apiName}]: There was a problem fetching [${config.method ?? 'GET'}] - ${buildURL}`,
      );
    }

    if (response.status === 204 || response.status === 202) {
      return {
        data: null as Response,
        status: response.status,
        error: null,
      };
    }

    const data = (await response.json()) as Response;

    return {
      data,
      status: response.status,
      error: null,
    };
  }

  public async call<Response = void, Payload extends object = object, NewResponse extends Response = Response>(
    config: HttpClientRequestConfig<Payload>,
    mapData: MappingDataResponseFunction<Response, NewResponse> = d => d as NewResponse,
  ): Promise<HttpClientResponse<NewResponse>> {
    try {
      const response = await this.callOrThrow<Response, Payload>(config);
      await this.log(config, RequestState.RESOLVED, response);

      return {
        ...response,
        data: mapData(response.data),
      };
    } catch (error: unknown) {
      const errorResponse = getHttpClientErrorResponse(error as Error);
      await this.log(config, RequestState.REJECTED, errorResponse);
      await this.onError(config, errorResponse);

      return errorResponse;
    }
  }
}
