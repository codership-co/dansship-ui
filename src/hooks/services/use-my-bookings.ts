import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { BookClassPayload, DansshipAPI, DansshipAPIError } from '@core/api';

export const useMyBookings = () => {
  const { t } = useTranslation();
  const { call: bookClassPromise, isLoading: isBookingClass } = useCallablePromise((payload: BookClassPayload) =>
    DansshipAPI.bookings.bookClass(payload),
  );
  const { call: cancelClassPromise, isLoading: isCancelingClass } = useCallablePromise((id: string) =>
    DansshipAPI.bookings.cancelBooking(id),
  );
  const { call: joinWaitlistPromise, isLoading: isJoiningWaitlist } = useCallablePromise((payload: BookClassPayload) =>
    DansshipAPI.bookings.joinWaitlist(payload),
  );
  const { call: cancelWaitlistPromise, isLoading: isCancelingWaitlist } = useCallablePromise((id: string) =>
    DansshipAPI.bookings.cancelWaitlist(id),
  );

  const bookClass = useCallback(
    async (payload: BookClassPayload) => {
      const { error } = await bookClassPromise(payload);

      if (error) {
        if (error instanceof DansshipAPIError) {
          const normalized = error.normalizedError;

          if (normalized.errorCode === 'BOOKING_CLASS_FULL' || normalized.errorCode === 'CLASS_FULL') {
            toast.error(t('bookings:classFullDesc'));
          } else if (normalized.errorCode === 'BOOKING_TIME_OVERLAP') {
            toast.error(t('bookings:timeOverlapDesc'));
          } else {
            toast.error(t('bookings:bookingFailed'));
          }
        } else {
          toast.error(t('bookings:bookingFailedDesc'));
        }
      } else {
        toast.success(t('bookings:bookSuccess'));
      }
    },
    [bookClassPromise, t],
  );

  const cancelClass = useCallback(
    async (id: string) => {
      const { error } = await cancelClassPromise(id);

      if (error) {
        toast.error(t('bookings:cancellationFailedDesc'));
      } else {
        toast.success(t('bookings:cancelSuccess'));
      }
    },
    [cancelClassPromise, t],
  );

  const joinWaitlist = useCallback(
    async (payload: BookClassPayload) => {
      const { error } = await joinWaitlistPromise(payload);

      if (error) {
        if (error instanceof DansshipAPIError) {
          const normalized = error.normalizedError;

          if (normalized.errorCode === 'BOOKING_TIME_OVERLAP') {
            toast.error(t('bookings:timeOverlapDesc'));
          } else {
            toast.error(t('bookings:waitlistFailed'));
          }
        } else {
          toast.error(t('bookings:waitlistFailedDesc'));
        }
      } else {
        toast.success(t('bookings:waitlistJoinSuccess'));
      }
    },
    [joinWaitlistPromise, t],
  );

  const cancelWaitlist = useCallback(
    async (id: string) => {
      const { error } = await cancelWaitlistPromise(id);

      if (error) {
        toast.error(t('bookings:waitlistCancelFailed'));
      } else {
        toast.success(t('bookings:waitlistCancelSuccess'));
      }
    },
    [cancelWaitlistPromise, t],
  );

  return {
    bookClass,
    cancelClass,
    joinWaitlist,
    cancelWaitlist,
    isBookingClass,
    isCancelingClass,
    isJoiningWaitlist,
    isCancelingWaitlist,
  };
};
