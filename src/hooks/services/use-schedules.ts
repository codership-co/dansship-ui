import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import {
  AddClassPayload,
  DansshipAPI,
  type CancelPublishedClassPayload,
  type EditPublishedClassPayload,
  type UpdateClassPayload,
} from '@core/api';

interface UseSchedulesOptions {
  weekStartDate?: string;
}

export const useSchedules = ({ weekStartDate }: UseSchedulesOptions = {}) => {
  const { t } = useTranslation();

  const {
    response: weeks,
    isLoading: isLoadingWeeks,
    reFetch: reFetchWeeks,
  } = usePromise(() => DansshipAPI.schedulesAdmin.getWeeks());

  const weekId = useMemo(() => {
    if (!weekStartDate) {
      return '';
    }

    return weeks?.data?.find(week => week.week_start_date === weekStartDate)?.id ?? '';
  }, [weekStartDate, weeks]);

  const {
    response: weekDetails,
    isLoading: isLoadingWeekDetails,
    reFetch: reFetchWeekDetails,
  } = usePromise(() => DansshipAPI.schedulesAdmin.getWeekDetail(weekId), weekId !== '', [weekId]);

  const { call: publishWeekPromise, isLoading: isPublishing } = useCallablePromise((targetWeekId: string) =>
    DansshipAPI.schedulesAdmin.publishWeek(targetWeekId),
  );
  const { call: addClassPromise, isLoading: isAdding } = useCallablePromise((payload: AddClassPayload) =>
    DansshipAPI.schedulesAdmin.addClass(payload),
  );
  const { call: updateClassPromise, isLoading: isUpdating } = useCallablePromise(
    (targetWeekId: string, classId: string, payload: UpdateClassPayload) =>
      DansshipAPI.schedulesAdmin.updateClass(targetWeekId, classId, payload),
  );
  const { call: removeClassPromise, isLoading: isRemoving } = useCallablePromise(
    (targetWeekId: string, classId: string) => DansshipAPI.schedulesAdmin.removeClass(targetWeekId, classId),
  );
  const { call: editPublishedClassPromise, isLoading: isEditing } = useCallablePromise(
    (targetWeekId: string, classId: string, payload: EditPublishedClassPayload) =>
      DansshipAPI.schedulesAdmin.editPublishedClass(targetWeekId, classId, payload),
  );
  const { call: cancelPublishedClassPromise, isLoading: isCanceling } = useCallablePromise(
    (targetWeekId: string, classId: string, payload: CancelPublishedClassPayload) =>
      DansshipAPI.schedulesAdmin.cancelPublishedClass(targetWeekId, classId, payload),
  );

  const refreshScheduleData = useCallback(async () => {
    await reFetchWeeks();

    if (weekId) {
      await reFetchWeekDetails();
    }
  }, [reFetchWeekDetails, reFetchWeeks, weekId]);

  const publishWeek = useCallback(
    async (targetWeekId: string) => {
      const { ok, data } = await publishWeekPromise(targetWeekId);

      if (ok) {
        toast.success(t('schedules:publishedSuccess'));
        await refreshScheduleData();
      } else {
        toast.error(t('schedules:publishFailed'));
      }

      return data;
    },
    [t, publishWeekPromise, refreshScheduleData],
  );
  const addClass = useCallback(
    async (payload: AddClassPayload) => {
      const { ok, data } = await addClassPromise(payload);

      if (ok) {
        toast.success(t('schedules:classAdded'));
        await refreshScheduleData();
      } else {
        toast.error(t('schedules:classAddFailed'));
      }

      return data;
    },
    [t, addClassPromise, refreshScheduleData],
  );
  const updateClass = useCallback(
    async (targetWeekId: string, classId: string, payload: UpdateClassPayload) => {
      const { ok, data } = await updateClassPromise(targetWeekId, classId, payload);

      if (ok) {
        toast.success(t('schedules:classUpdated'));
        await refreshScheduleData();
      } else {
        toast.error(t('schedules:classUpdateFailed'));
      }

      return data;
    },
    [t, updateClassPromise, refreshScheduleData],
  );
  const removeClass = useCallback(
    async (targetWeekId: string, classId: string) => {
      const { ok, data } = await removeClassPromise(targetWeekId, classId);

      if (ok) {
        toast.success(t('schedules:classRemoved'));
        await refreshScheduleData();
      } else {
        toast.error(t('schedules:classRemoveFailed'));
      }

      return data;
    },
    [t, removeClassPromise, refreshScheduleData],
  );
  const editPublishedClass = useCallback(
    async (targetWeekId: string, classId: string, payload: EditPublishedClassPayload) => {
      const { ok, data } = await editPublishedClassPromise(targetWeekId, classId, payload);

      if (ok) {
        toast.success(t('schedules:classUpdated'));
        await refreshScheduleData();
      } else {
        toast.error(t('schedules:classUpdateFailed'));
      }

      return data;
    },
    [t, editPublishedClassPromise, refreshScheduleData],
  );
  const cancelPublishedClass = useCallback(
    async (targetWeekId: string, classId: string, payload: CancelPublishedClassPayload = {}) => {
      const { ok, data } = await cancelPublishedClassPromise(targetWeekId, classId, payload);

      if (ok) {
        toast.success(t('schedules:classCancelled'));
        await refreshScheduleData();
      } else {
        toast.error(t('schedules:classCancelFailed'));
      }

      return data;
    },
    [t, cancelPublishedClassPromise, refreshScheduleData],
  );

  return {
    weeks: weeks?.data ?? [],
    weekId,
    isLoadingWeeks,
    activeWeekDetail: weekDetails?.data ?? null,
    isLoadingWeekDetails,
    publishWeek,
    addClass,
    updateClass,
    removeClass,
    editPublishedClass,
    cancelPublishedClass,
    isPublishing,
    isCreatingClass: isAdding,
    isUpdatingClass: isUpdating,
    isEditingPublishedClass: isEditing,
    isCancellingPublishedClass: isCanceling,
    isRemovingClass: isRemoving,
    reFetchWeeks,
    reFetchWeekDetails,
  };
};
