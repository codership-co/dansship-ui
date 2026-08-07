import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { DansshipAPI, type ManualAddStudentPayload, type MarkAttendancePayload } from '@core/api';
import { captureUnexpectedException, withSentrySpan } from '@core/sentry';

export const useInstructorRoster = () => {
  const { t } = useTranslation();

  const { call: markAttendancePromise, isLoading: isMarking } = useCallablePromise(
    (bookingId: string, payload: MarkAttendancePayload) => DansshipAPI.bookings.markAttendance(bookingId, payload),
  );

  const markAttendance = useCallback(
    async (bookingId: string, payload: MarkAttendancePayload): Promise<boolean> => {
      return withSentrySpan(
        'instructor.mark_attendance',
        'ui.action',
        { booking_id: bookingId, attendance_status: payload.status },
        async () => {
          const { ok, error } = await markAttendancePromise(bookingId, payload);

          if (ok) {
            toast.success(t('instructor:roster.attendanceUpdated'));

            return true;
          }

          toast.error(t('instructor:roster.updateAttendanceFailed'));
          captureUnexpectedException(error ?? new Error('Mark attendance failed'), {
            tags: {
              flow: 'instructor.mark_attendance',
              booking_id: bookingId,
              attendance_status: payload.status,
            },
          });

          return false;
        },
      );
    },
    [t, markAttendancePromise],
  );

  const { call: manualAddStudentPromise, isLoading: isAdding } = useCallablePromise(
    (classId: string, payload: ManualAddStudentPayload) => DansshipAPI.instructors.manualAddStudent(classId, payload),
  );

  const manualAddStudent = useCallback(
    async (classId: string, payload: ManualAddStudentPayload) => {
      await withSentrySpan(
        'instructor.manual_add',
        'ui.action',
        { class_id: classId, user_id: payload.user_id },
        async () => {
          const { ok, error } = await manualAddStudentPromise(classId, payload);

          if (ok) {
            toast.success(t('instructor:roster.studentAddedSuccess'));
          } else {
            toast.error(t('instructor:roster.studentAddFailed'));
            captureUnexpectedException(error ?? new Error('Manual add student failed'), {
              tags: { flow: 'instructor.manual_add', class_id: classId, user_id: payload.user_id },
            });
          }
        },
      );
    },
    [t, manualAddStudentPromise],
  );

  return {
    markAttendance,
    isMarking,
    manualAddStudent,
    isAdding,
  };
};
