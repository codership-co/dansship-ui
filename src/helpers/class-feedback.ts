import { DANSSHIP_ERROR_CODE, DansshipAPIError } from '../core/api/dansship.error';

export const CLASS_CSAT_TYPE = 'class_csat';

export const CLASS_FEEDBACK_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export interface ClassFeedbackClassContext {
  scheduled_class_id: string;
  class_name?: string | null;
  class_start_time?: string | null;
  class_end_time?: string | null;
  instructor_id?: string | null;
  instructor_name?: string | null;
  /** Set when the class belongs to a managed minor of the signed-in guardian. */
  attendee_user_id?: string | null;
  attendee_name?: string | null;
}

export function parseClassCsatDeliveryContext(
  value: Record<string, unknown> | null | undefined,
): ClassFeedbackClassContext | null {
  if (!value) {
    return null;
  }

  const scheduledClassId = value.scheduled_class_id;

  if (typeof scheduledClassId !== 'string' || !scheduledClassId) {
    return null;
  }

  return {
    scheduled_class_id: scheduledClassId,
    class_name: typeof value.class_name === 'string' ? value.class_name : null,
    class_start_time: typeof value.class_start_time === 'string' ? value.class_start_time : null,
    class_end_time: typeof value.class_end_time === 'string' ? value.class_end_time : null,
    instructor_id: typeof value.instructor_id === 'string' ? value.instructor_id : null,
    instructor_name: typeof value.instructor_name === 'string' ? value.instructor_name : null,
    attendee_user_id:
      typeof value.attendee_user_id === 'string' && value.attendee_user_id ? value.attendee_user_id : null,
    attendee_name: typeof value.attendee_name === 'string' && value.attendee_name ? value.attendee_name : null,
  };
}

/**
 * Key of a rating for "already rated": one rating per class and attendee, so a
 * guardian and their minor in the same class are rated separately.
 */
export function classFeedbackKey(attendeeUserId: string, scheduledClassId: string) {
  return `${attendeeUserId}:${scheduledClassId}`;
}

const CLASS_FEEDBACK_ERROR_CODES = new Set<string>([
  DANSSHIP_ERROR_CODE.CLASS_FEEDBACK_NOT_ELIGIBLE,
  DANSSHIP_ERROR_CODE.CLASS_FEEDBACK_ALREADY_SUBMITTED,
  DANSSHIP_ERROR_CODE.ACTING_FOR_FORBIDDEN,
]);

/** i18n key for a failed rating, falling back to the generic message. */
export function classFeedbackErrorKey(error: unknown): string {
  if (error instanceof DansshipAPIError && CLASS_FEEDBACK_ERROR_CODES.has(error.body.error_code)) {
    return `errors:codes.${error.body.error_code}`;
  }

  return 'bookings:rateFailed';
}

export function isWithinClassFeedbackWindow(endTime: string, now = Date.now()) {
  const endedAt = new Date(endTime).getTime();

  if (Number.isNaN(endedAt) || endedAt > now) {
    return false;
  }

  return now - endedAt <= CLASS_FEEDBACK_WINDOW_MS;
}

export function canRateBooking(options: {
  status: string;
  endTime: string;
  instructorId?: string | null;
  alreadyRated: boolean;
  isCancelled?: boolean;
  now?: number;
}) {
  if (options.isCancelled) {
    return false;
  }

  if (options.status !== 'attended') {
    return false;
  }

  if (!options.instructorId) {
    return false;
  }

  if (options.alreadyRated) {
    return false;
  }

  return isWithinClassFeedbackWindow(options.endTime, options.now);
}
