import { describe, expect, it } from 'vitest';

import { DANSSHIP_ERROR_CATEGORY, DANSSHIP_ERROR_CODE, DansshipAPIError } from '../dansship.error';

import { cancelClassErrorKey } from './schedules.helpers';

function apiError(errorCode: DANSSHIP_ERROR_CODE, status: number): DansshipAPIError {
  return new DansshipAPIError(
    {
      category: DANSSHIP_ERROR_CATEGORY.CONFLICT,
      error_code: errorCode,
      message: 'error',
      status,
      timestamp: new Date(0).toISOString(),
      path: '/admin/schedules/weeks/w/classes/c/published-cancel',
      details: {},
    } as never,
    status,
    'error',
  );
}

describe('cancelClassErrorKey', () => {
  it('maps retroactive cancellation error codes to their copy', () => {
    expect(cancelClassErrorKey(apiError(DANSSHIP_ERROR_CODE.SCHEDULE_CLASS_ALREADY_BILLED, 409))).toBe(
      'errors:codes.SCHEDULE_CLASS_ALREADY_BILLED',
    );
    expect(cancelClassErrorKey(apiError(DANSSHIP_ERROR_CODE.SCHEDULE_CANCEL_NOTE_REQUIRED, 400))).toBe(
      'errors:codes.SCHEDULE_CANCEL_NOTE_REQUIRED',
    );
  });

  it('falls back to the generic cancel failure copy', () => {
    expect(cancelClassErrorKey(apiError(DANSSHIP_ERROR_CODE.INVALID_SCHEDULE_STATE, 400))).toBe(
      'schedules:classCancelFailed',
    );
    expect(cancelClassErrorKey(new Error('boom'))).toBe('schedules:classCancelFailed');
    expect(cancelClassErrorKey(null)).toBe('schedules:classCancelFailed');
  });
});
