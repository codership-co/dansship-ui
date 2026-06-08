import { type DansshipAPIResponseError, type NormalizedError, DansshipAPIError } from './dansship.error';

import type { TFunction } from 'i18next';

type JsonRecord = Record<string, unknown>;

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value : undefined;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const shouldUseLegacyDetailAsDetails = (detail: unknown): boolean => Array.isArray(detail) || isRecord(detail);

const resolveMessageFromLegacyDetail = (detail: unknown): string | undefined => {
  const direct = asString(detail);

  if (direct) {
    return direct;
  }

  if (isRecord(detail)) {
    const nestedMessage = asString(detail.message);

    if (nestedMessage) {
      return nestedMessage;
    }
  }

  if (Array.isArray(detail)) {
    const first = detail[0];

    if (isRecord(first)) {
      const validationMsg = asString(first.msg) ?? asString(first.message);

      if (validationMsg) {
        return validationMsg;
      }
    }
  }

  return undefined;
};

async function getNormalizedError(
  body: DansshipAPIResponseError,
  status: number,
  defaultMessage: string,
): Promise<NormalizedError> {
  if (isRecord(body.error)) {
    const envelope = body.error;
    const legacyDetail = body.detail;

    const errorCode = asString(envelope.error_code) ?? asString(envelope.code);
    const category = asString(envelope.category);
    const path = asString(envelope.path);
    const timestamp = asString(envelope.timestamp);

    const explicitDetails = envelope.details;
    const details = explicitDetails ?? (shouldUseLegacyDetailAsDetails(legacyDetail) ? legacyDetail : undefined);

    const message = asString(envelope.message) ?? resolveMessageFromLegacyDetail(legacyDetail) ?? defaultMessage;

    return {
      status,
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

  return {
    status,
    message: defaultMessage,
  };
}

export async function getResponseError(response: Response, message: string) {
  const body = (await response.json()) as DansshipAPIResponseError;
  const normalizedError = await getNormalizedError(body, response.status, message);

  return new DansshipAPIError(body, response.status, normalizedError.message, normalizedError);
}

// ------------

const getTranslationIfExists = (t: TFunction, key: string): string | undefined => {
  const translated = t(key);

  return translated !== key ? translated : undefined;
};

export function getUserFacingError(
  error: Pick<NormalizedError, 'errorCode' | 'status' | 'message'>,
  t: TFunction,
): { title: string; description: string } {
  const description = (() => {
    if (error.errorCode) {
      const codeKey = `errors.codes.${error.errorCode}`;
      const translated = getTranslationIfExists(t, codeKey);

      if (translated) {
        return translated;
      }
    }

    const explicitMessage = asString(error.message);

    if (explicitMessage) {
      return explicitMessage;
    }

    return t('errors.codes.BAD_REQUEST_GENERIC');
  })();

  return {
    title: 'Error',
    description,
  };
}

const stripApiErrorPrefix = (message: string): string => message.replace(/^API Error \(\d+\):\s*/, '').trim();

const asStatusCode = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

export function getErrorInputFromUnknown(
  error: unknown,
  fallbackMessage = 'Request failed',
): Pick<NormalizedError, 'errorCode' | 'status' | 'message'> {
  const fallback = asString(fallbackMessage) ?? 'Request failed';

  if (!isRecord(error)) {
    return {
      status: 500,
      message: fallback,
      errorCode: '',
    };
  }

  const status = asStatusCode(error.status) ?? 500;
  const errorCode = asString(error.errorCode) ?? asString(error.code);

  const explicitMessage = asString(error.apiMessage);
  const detailMessage =
    resolveMessageFromLegacyDetail(error.detail) ??
    resolveMessageFromLegacyDetail(error.legacyDetail) ??
    resolveMessageFromLegacyDetail(error.details);
  const rawMessage = asString(error.message);

  const message = explicitMessage ?? detailMessage ?? (rawMessage ? stripApiErrorPrefix(rawMessage) : fallback);

  return {
    status,
    errorCode,
    message,
  };
}

export type FieldValidationErrors = Record<string, Array<string>>;

const appendValidationMessage = (result: FieldValidationErrors, field: string, message: string): void => {
  if (!result[field]) {
    result[field] = [];
  }

  result[field].push(message);
};

export function extractFieldValidationErrors(details: unknown): FieldValidationErrors {
  const result: FieldValidationErrors = {};

  if (Array.isArray(details)) {
    for (const item of details) {
      if (!isRecord(item)) {
        continue;
      }

      const rawLoc = item.loc;
      const loc = Array.isArray(rawLoc)
        ? rawLoc
            .filter((part): part is string | number => typeof part === 'string' || typeof part === 'number')
            .map(String)
            .filter(part => part !== 'body' && part !== 'query' && part !== 'path')
        : [];

      const field = loc.length > 0 ? loc.join('.') : 'non_field';
      const message = asString(item.msg) ?? asString(item.message);

      if (!message) {
        continue;
      }

      appendValidationMessage(result, field, message);
    }

    return result;
  }

  if (!isRecord(details)) {
    return result;
  }

  for (const [field, value] of Object.entries(details)) {
    if (typeof value === 'string') {
      appendValidationMessage(result, field, value);

      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') {
          appendValidationMessage(result, field, item);
        }
      }

      continue;
    }

    if (isRecord(value)) {
      const nestedMessage = asString(value.message) ?? asString(value.msg);

      if (nestedMessage) {
        appendValidationMessage(result, field, nestedMessage);
      }
    }
  }

  return result;
}
