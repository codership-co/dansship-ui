export interface DefaultHttpClientError {
  type: string;
  code: string;
  message?: string;
  errors?: { [key: string]: Array<string> };
}

export async function getResponseErrorMessage(
  response: Response,
  defaultMessage: string = 'Unexpected error occurred.',
) {
  const body = (await response.json()) as DefaultHttpClientError;

  if (!body) {
    return 'No body founded on the response.';
  }

  if (body.message) {
    return body.message;
  }

  if (body.errors) {
    let message = '';

    for (const [key, values] of Object.entries(body.errors)) {
      message += `${key}: ${values.join(', ')}. `;
    }

    return message;
  }

  return defaultMessage;
}
