export const CLASS_CSAT_TYPE = 'class_csat';

export const CLASS_FEEDBACK_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

export interface ClassFeedbackClassContext {
  scheduled_class_id: string;
  class_name?: string | null;
  class_start_time?: string | null;
  class_end_time?: string | null;
  instructor_id?: string | null;
  instructor_name?: string | null;
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
  };
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
