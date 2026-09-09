import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { DansshipAPI, type MarkAttendancePayload } from '@core/api';
import { captureUnexpectedException, withSentrySpan } from '@core/sentry';

export const useAdminRoster = () => {
  const { t } = useTranslation();

  const { call: adjustAttendancePromise, isLoading: isMarking } = useCallablePromise(
    (bookingId: string, payload: MarkAttendancePayload) =>
      DansshipAPI.bookingsAdmin.adjustAttendance(bookingId, payload),
  );

  const adjustAttendance = useCallback(
    async (bookingId: string, payload: MarkAttendancePayload): Promise<boolean> => {
      return withSentrySpan(
        'admin.adjust_attendance',
        'ui.action',
        { booking_id: bookingId, attendance_status: payload.status },
        async () => {
          const { ok, error } = await adjustAttendancePromise(bookingId, payload);

          if (ok) {
            toast.success(t('admin:roster.attendanceUpdated'));

            return true;
          }

          toast.error(t('admin:roster.updateAttendanceFailed'));
          captureUnexpectedException(error ?? new Error('Admin adjust attendance failed'), {
            tags: {
              flow: 'admin.adjust_attendance',
              booking_id: bookingId,
              attendance_status: payload.status,
            },
          });

          return false;
        },
      );
    },
    [t, adjustAttendancePromise],
  );

  return {
    adjustAttendance,
    isMarking,
  };
};
