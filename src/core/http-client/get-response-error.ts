import { HttpClientError, type HttpClientResponseError, type NormalizedError } from './http-client-error';

type JsonRecord = Record<string, unknown>;

const isString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const shouldUseLegacyDetailAsDetails = (detail: unknown): boolean => Array.isArray(detail) || isRecord(detail);

const resolveMessageFromLegacyDetail = (detail: unknown): string | undefined => {
  const direct = isString(detail);

  if (direct) {
    return direct;
  }

  if (isRecord(detail)) {
    const nestedMessage = isString(detail.message);

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if (Array.isArray(detail)) {
    const first = detail[0];

    if (isRecord(first)) {
      const validationMsg = isString(first.msg) ?? isString(first.message);

      if (validationMsg) {
        return validationMsg;
      }
    }
  }

  return undefined;
};

async function getNormalizedError(response: Response, message: string): Promise<NormalizedError | undefined> {
  const body = (await response.json()) as HttpClientResponseError;

  if (isRecord(body.error)) {
    const envelope = body.error;
    const legacyDetail = body.detail;

    const errorCode = isString(envelope.error_code) ?? isString(envelope.code);
    const category = isString(envelope.category);
    const path = isString(envelope.path);
    const timestamp = isString(envelope.timestamp);

    const explicitDetails = envelope.details;
    const details = explicitDetails ?? (shouldUseLegacyDetailAsDetails(legacyDetail) ? legacyDetail : undefined);

    return {
      status: response.status,
      message,
      errorCode,
      category,
      details,
      legacyDetail,
      detail: legacyDetail,
      path,
      timestamp,
    };
  }

  return undefined;
}

export async function getResponseErrorMessage(
  response: Response,
  defaultMessage: string = 'Unexpected error occurred.',
) {
  const body = (await response.json()) as HttpClientResponseError;

  if (!body) {
    return 'No error body founded on the response.';
  }

  if (body.message) {
    return body.message;
  }

  if (isRecord(body.error)) {
    const envelope = body.error;
    const legacyDetail = body.detail;

    return isString(envelope.message) ?? resolveMessageFromLegacyDetail(legacyDetail) ?? defaultMessage;
  }

  return defaultMessage;
}

export async function getResponseError(response: Response, defaultMessage: string = 'Unexpected error occurred.') {
  const message = await getResponseErrorMessage(response, defaultMessage);
  const normalizedError = getNormalizedError(response, message);

  return new HttpClientError(response.status, message, normalizedError);
}
