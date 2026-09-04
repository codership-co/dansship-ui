import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { BookClassPayload, DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError } from '@core/api';
import { captureUnexpectedException, withSentrySpan } from '@core/sentry';

export const useMyBookings = () => {
  const { t } = useTranslation();
  const { call: bookClassPromise, isLoading: isBookingClass } = useCallablePromise((payload: BookClassPayload) =>
    DansshipAPI.bookings.bookClass(payload),
  );
  const { call: cancelClassPromise, isLoading: isCancelingClass } = useCallablePromise((id: string) =>
    DansshipAPI.bookings.cancelBooking(id),
  );

  const bookClass = useCallback(
    async (payload: BookClassPayload) => {
      return withSentrySpan('booking.create', 'ui.action', { class_id: payload.scheduled_class_id }, async () => {
        const { error } = await bookClassPromise(payload);

        if (error) {
          if (error instanceof DansshipAPIError) {
            const { error_code } = error.body;

            if (
              error_code === DANSSHIP_ERROR_CODE.BOOKING_CLASS_FULL ||
              error_code === DANSSHIP_ERROR_CODE.CLASS_FULL
            ) {
              toast.error(t('bookings:classFullDesc'));
            } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_TIME_OVERLAP) {
              toast.error(t('bookings:timeOverlapDesc'));
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
            } else {
              toast.error(t('bookings:bookingFailedDesc'));
            }

            captureUnexpectedException(error, {
              skipIfExpected: 'booking',
              tags: { flow: 'booking.create', class_id: payload.scheduled_class_id },
            });
          } else {
            toast.error(t('bookings:bookingFailedDesc'));
            captureUnexpectedException(error, {
              tags: { flow: 'booking.create', class_id: payload.scheduled_class_id },
            });
          }

          return false;
        }

        toast.success(t('bookings:bookSuccess'));

        return true;
      });
    },
    [bookClassPromise, t],
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
