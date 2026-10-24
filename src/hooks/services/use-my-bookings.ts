import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { useAuth } from '@contexts';
import {
  BookClassPayload,
  BookClassResponse,
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  isDansshipTransportError,
  type MyBookingsPage,
} from '@core/api';
import { captureUnexpectedException, isTransportFailure, withSentrySpan } from '@core/sentry';

function pageIsComplete(page: MyBookingsPage): boolean {
  return page.offset + page.items.length >= page.total;
}

async function hasActiveBookingForClass(scheduledClassId: string, attendeeUserId?: string): Promise<boolean | null> {
  const { ok, data } = await DansshipAPI.bookings.getMyBookings({
    scope: 'upcoming',
    limit: 100,
    ...(attendeeUserId ? { attendee_user_id: attendeeUserId } : {}),
  });

  if (!ok || !data) {
    return null;
  }

  if (
    data.items.some(
      item =>
        item.scheduled_class_id === scheduledClassId &&
        item.status === 'active' &&
        (!attendeeUserId || item.user_id === attendeeUserId),
    )
  ) {
    return true;
  }

  return pageIsComplete(data) ? false : null;
}

async function bookingNoLongerActive(bookingId: string): Promise<boolean | null> {
  const { ok, data } = await DansshipAPI.bookings.getMyBookings({ scope: 'upcoming', limit: 100 });

  if (!ok || !data) {
    return null;
  }

  if (data.items.some(item => item.id === bookingId && item.status === 'active')) {
    return false;
  }

  return pageIsComplete(data) ? true : null;
}

const companionErrorToastKey = (errorCode: string | undefined) => {
  switch (errorCode) {
    case DANSSHIP_ERROR_CODE.JUEVES_2X1_COMPANION_NOT_FOUND:
      return 'bookings:companionNotFound';
    case DANSSHIP_ERROR_CODE.JUEVES_2X1_SELF_REFERENCE:
      return 'bookings:companionSelfReference';
    case DANSSHIP_ERROR_CODE.JUEVES_2X1_NOT_ELIGIBLE:
      return 'bookings:companionNotEligible';
    case DANSSHIP_ERROR_CODE.BOOKING_CLASS_FULL:
    case DANSSHIP_ERROR_CODE.CLASS_FULL:
      return 'bookings:companionClassFull';
    default:
      return 'bookings:companionFailed';
  }
};

export const useMyBookings = () => {
  const { t } = useTranslation();
  const { call: bookClassPromise, isLoading: isBookingClass } = useCallablePromise((payload: BookClassPayload) =>
    DansshipAPI.bookings.bookClass(payload),
  );
  const { call: cancelClassPromise, isLoading: isCancelingClass } = useCallablePromise((id: string) =>
    DansshipAPI.bookings.cancelBooking(id),
  );

  const { user } = useAuth();
  const bookClass = useCallback(
    async (payload: BookClassPayload) => {
      const bookingForOther = Boolean(
        payload.attendee_user_id && user?.id && payload.attendee_user_id !== String(user.id),
      );

      return withSentrySpan('booking.create', 'ui.action', { class_id: payload.scheduled_class_id }, async () => {
        const { error, data } = await bookClassPromise(payload);

        if (error) {
          if (isDansshipTransportError(error)) {
            const booked = await hasActiveBookingForClass(
              payload.scheduled_class_id,
              payload.attendee_user_id ?? (user?.id ? String(user.id) : undefined),
            );

            captureUnexpectedException(error, {
              tags: { flow: 'booking.create', class_id: payload.scheduled_class_id },
            });

            if (booked) {
              toast.success(t('bookings:bookSuccess'));

              return { ok: true };
            }

            toast.error(t('bookings:connectionFailedDesc'));
          } else if (error instanceof DansshipAPIError) {
            const { error_code } = error.body;

            if (
              error_code === DANSSHIP_ERROR_CODE.BOOKING_CLASS_FULL ||
              error_code === DANSSHIP_ERROR_CODE.CLASS_FULL
            ) {
              toast.error(t('bookings:classFullDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_TIME_OVERLAP) {
              toast.error(t(bookingForOther ? 'bookings:timeOverlapWarningOther' : 'bookings:timeOverlapDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_INSTRUCTOR_OWN_CLASS) {
              toast.error(t('bookings:instructorOwnClassDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_INSTRUCTOR_TEACHING_OVERLAP) {
              toast.error(t('bookings:instructorTeachingOverlapDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_CLASS_GROUP_NOT_COVERED) {
              toast.error(t('bookings:classGroupNotCoveredDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_STARTED) {
              toast.error(t('bookings:subscriptionNotStartedDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_EXPIRED) {
              toast.error(t('bookings:subscriptionExpiredDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_ELIGIBLE) {
              toast.error(t('bookings:subscriptionNotEligibleDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_LATE_JOIN_CLOSED) {
              toast.error(t('bookings:lateJoinClosedDesc'));
            } else if (
              error_code === DANSSHIP_ERROR_CODE.JUEVES_2X1_COMPANION_NOT_FOUND ||
              error_code === DANSSHIP_ERROR_CODE.JUEVES_2X1_SELF_REFERENCE ||
              error_code === DANSSHIP_ERROR_CODE.JUEVES_2X1_NOT_ELIGIBLE
            ) {
              toast.error(t(companionErrorToastKey(error_code)));
            } else {
              toast.error(t('bookings:bookingFailedDesc'));
            }

            captureUnexpectedException(error, {
              skipIfExpected: 'booking',
              tags: { flow: 'booking.create', class_id: payload.scheduled_class_id },
            });
          } else {
            toast.error(t(isTransportFailure(error) ? 'bookings:connectionFailedDesc' : 'bookings:bookingFailedDesc'));
            captureUnexpectedException(error, {
              tags: { flow: 'booking.create', class_id: payload.scheduled_class_id },
            });
          }

          return {
            ok: false,
            errorCode: error instanceof DansshipAPIError ? error.body.error_code : undefined,
          };
        }

        const bookingResult = data as BookClassResponse | undefined;

        if (bookingResult?.companion_error) {
          toast.error(t(companionErrorToastKey(bookingResult.companion_error.error_code)));

          return { ok: false, errorCode: bookingResult.companion_error.error_code };
        }

        toast.success(t('bookings:bookSuccess'));

        if (bookingResult?.companion_booking) {
          toast.success(t('bookings:companionSuccess'));
        }

        return { ok: true };
      });
    },
    [bookClassPromise, t, user],
  );

  const cancelClass = useCallback(
    async (id: string) => {
      return withSentrySpan('booking.cancel', 'ui.action', { booking_id: id }, async () => {
        const { error } = await cancelClassPromise(id);

        if (error) {
          if (
            error instanceof DansshipAPIError &&
            error.body.error_code === DANSSHIP_ERROR_CODE.BOOKING_NOT_CANCELLABLE
          ) {
            toast.success(t('bookings:cancelSuccess'));

            return true;
          }

          if (isDansshipTransportError(error)) {
            const cancelled = await bookingNoLongerActive(id);

            captureUnexpectedException(error, {
              tags: { flow: 'booking.cancel', booking_id: id },
            });

            if (cancelled) {
              toast.success(t('bookings:cancelSuccess'));

              return true;
            }

            toast.error(t('bookings:cancellationFailedDesc'));

            return false;
          }

          toast.error(t('bookings:cancellationFailedDesc'));
          captureUnexpectedException(error, {
            skipIfExpected: 'booking',
            tags: { flow: 'booking.cancel', booking_id: id },
          });

          return false;
        }

        toast.success(t('bookings:cancelSuccess'));

        return true;
      });
    },
    [cancelClassPromise, t],
  );

  return {
    bookClass,
    cancelClass,
    isBookingClass,
    isCancelingClass,
  };
};
