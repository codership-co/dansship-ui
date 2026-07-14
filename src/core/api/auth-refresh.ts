import { HttpClient, type HttpClientRequestConfig, type HttpClientResponse } from 'polpo-http-client';

import { DansshipAPIError } from './dansship.error';

import { AUTH_SESSION_KEY } from '@core/constants';

const AUTH_REFRESH_SKIP_PATHS = new Set(['/auth/refresh-token', '/auth/signin', '/auth/signup', '/auth/signout']);

let refreshPromise: Promise<void> | null = null;

function hasActiveSession() {
  return localStorage.getItem(AUTH_SESSION_KEY) === '1';
}

function shouldRefreshForPath(path?: string) {
  return hasActiveSession() && !AUTH_REFRESH_SKIP_PATHS.has(path ?? '');
}

function isUnauthorizedError(error: unknown): error is DansshipAPIError {
  return error instanceof DansshipAPIError && error.status === 401;
}

function isUnauthorizedResponse(response: HttpClientResponse<unknown, DansshipAPIError>) {
  return !response.ok && response.status === 401;
}

async function refreshAuthSession(refresh: () => Promise<unknown>) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        await refresh();
      } catch (error) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem('refreshing_token');
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

export function installAuthRefreshInterceptor(
  httpClient: HttpClient<DansshipAPIError>,
  refreshToken: () => Promise<unknown>,
) {
  const originalCall = httpClient.call.bind(httpClient) as {
    <Response, Data extends object = object>(config: HttpClientRequestConfig<Data>): Promise<Response>;
    <Response, Data extends object = object, NewResponse = Response>(
      config: HttpClientRequestConfig<Data>,
      mapData: (data: Response) => NewResponse,
    ): Promise<NewResponse>;
  };

  const originalCallNoError = httpClient.callNoError.bind(httpClient) as {
    <Response = void, Data extends object = object>(
      config: HttpClientRequestConfig<Data>,
    ): Promise<HttpClientResponse<Response, DansshipAPIError>>;
    <Response = void, Data extends object = object, NewResponse = Response>(
      config: HttpClientRequestConfig<Data>,
      mapData: (data: Response) => NewResponse,
    ): Promise<HttpClientResponse<NewResponse, DansshipAPIError>>;
  };

  httpClient.call = (async <Response, Data extends object = object, NewResponse = Response>(
    config: HttpClientRequestConfig<Data>,
    mapData?: (data: Response) => NewResponse,
  ) => {
    try {
      return mapData ? await originalCall(config, mapData) : await originalCall(config);
    } catch (error) {
      if (!isUnauthorizedError(error) || !shouldRefreshForPath(config.path)) {
        throw error;
      }

      try {
        await refreshAuthSession(refreshToken);
      } catch {
        throw error;
      }

      return mapData ? originalCall(config, mapData) : originalCall(config);
    }
  }) as typeof httpClient.call;

  httpClient.callNoError = (async <Response = void, Data extends object = object, NewResponse = Response>(
    config: HttpClientRequestConfig<Data>,
    mapData?: (data: Response) => NewResponse,
  ) => {
    const response = mapData ? await originalCallNoError(config, mapData) : await originalCallNoError(config);

    if (!isUnauthorizedResponse(response) || !shouldRefreshForPath(config.path)) {
      return response;
    }

    try {
      await refreshAuthSession(refreshToken);
    } catch {
      return response;
    }

    return mapData ? originalCallNoError(config, mapData) : originalCallNoError(config);
  }) as typeof httpClient.callNoError;
}
