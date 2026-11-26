import { describe, expect, it } from 'vitest';

import { DANSSHIP_ERROR_CATEGORY, DANSSHIP_ERROR_CODE, DansshipAPIError } from '../core/api/dansship.error';

import { classFeedbackErrorKey, classFeedbackKey, parseClassCsatDeliveryContext } from './class-feedback';

function apiError(code: DANSSHIP_ERROR_CODE, status: number) {
  return new DansshipAPIError(
    {
      error_code: code,
      category: DANSSHIP_ERROR_CATEGORY.VALIDATION_ERROR,
      message: code,
      status,
      timestamp: new Date(0).toISOString(),
      path: '/class-feedback',
      details: {},
    } as never,
    status,
    code,
  );
}

describe('classFeedbackKey', () => {
  it('keeps a guardian and a minor in the same class apart', () => {
    expect(classFeedbackKey('guardian', 'class-1')).not.toBe(classFeedbackKey('minor', 'class-1'));
    expect(classFeedbackKey('minor', 'class-1')).toBe('minor:class-1');
  });
});

describe('parseClassCsatDeliveryContext', () => {
  it('reads the minor the banner asks about', () => {
    const context = parseClassCsatDeliveryContext({
      scheduled_class_id: 'class-1',
      class_name: 'Pole Kids',
      attendee_user_id: 'minor-1',
      attendee_name: 'Sofía',
    });

    expect(context?.attendee_user_id).toBe('minor-1');
    expect(context?.attendee_name).toBe('Sofía');
  });

  it('treats the user own class as having no attendee', () => {
    const context = parseClassCsatDeliveryContext({
      scheduled_class_id: 'class-1',
      attendee_user_id: null,
      attendee_name: null,
    });

    expect(context?.attendee_user_id).toBeNull();
    expect(context?.attendee_name).toBeNull();
    expect(parseClassCsatDeliveryContext({ scheduled_class_id: 'class-1' })?.attendee_user_id).toBeNull();
  });
});

describe('classFeedbackErrorKey', () => {
  it('maps the rating errors to their own copy', () => {
    expect(classFeedbackErrorKey(apiError(DANSSHIP_ERROR_CODE.CLASS_FEEDBACK_NOT_ELIGIBLE, 422))).toBe(
      'errors:codes.CLASS_FEEDBACK_NOT_ELIGIBLE',
    );
    expect(classFeedbackErrorKey(apiError(DANSSHIP_ERROR_CODE.ACTING_FOR_FORBIDDEN, 403))).toBe(
      'errors:codes.ACTING_FOR_FORBIDDEN',
    );
  });

  it('falls back to the generic message', () => {
    expect(classFeedbackErrorKey(apiError(DANSSHIP_ERROR_CODE.BAD_REQUEST, 400))).toBe('bookings:rateFailed');
    expect(classFeedbackErrorKey(new Error('boom'))).toBe('bookings:rateFailed');
    expect(classFeedbackErrorKey(null)).toBe('bookings:rateFailed');
  });
});
