import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { DansshipAPI, type ManualAddStudentPayload, type MarkAttendancePayload } from '@core/api';

export const useInstructorRoster = () => {
  const { t } = useTranslation();

  const { call: markAttendancePromise, isLoading: isMarking } = useCallablePromise(
    (bookingId: string, payload: MarkAttendancePayload) => DansshipAPI.bookings.markAttendance(bookingId, payload),
  );

  const markAttendance = useCallback(
    async (bookingId: string, payload: MarkAttendancePayload) => {
      const { ok } = await markAttendancePromise(bookingId, payload);

      if (ok) {
        toast.success(t('instructor:roster.attendanceUpdated'));
      } else {
        toast.error(t('instructor:roster.updateAttendanceFailed'));
      }
    },
    [t, markAttendancePromise],
  );

  const { call: manualAddStudentPromise, isLoading: isAdding } = useCallablePromise(
    (classId: string, payload: ManualAddStudentPayload) => DansshipAPI.instructors.manualAddStudent(classId, payload),
  );

  const manualAddStudent = useCallback(
    async (classId: string, payload: ManualAddStudentPayload) => {
      const { ok } = await manualAddStudentPromise(classId, payload);

      if (ok) {
        toast.success(t('instructor:roster.studentAddedSuccess'));
      } else {
        toast.error(t('instructor:roster.studentAddFailed'));
      }
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
