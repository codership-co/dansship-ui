import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import {
  AddClassPayload,
  CreateWeekPayload,
  DansshipAPI,
  type EditPublishedClassPayload,
  ScheduleWeek,
  type UpdateClassPayload,
  type UpdateWaitlistConfigPayload,
} from '@core/api';

export const useSchedules = (weekId: ScheduleWeek['id'] = '') => {
  const { t } = useTranslation();

  const { response: weeks, isLoading: isLoadingWeeks } = usePromise(() => DansshipAPI.schedulesAdmin.getWeeks());
  const { response: weekDetails, isLoading: isLoadingWeekDetails } = usePromise(
    () => DansshipAPI.schedulesAdmin.getWeekDetail(weekId),
    weekId !== '',
  );
  const { response: waitlistDefaults } = usePromise(() => DansshipAPI.schedulesAdmin.getWaitlistDefault());

  const { call: createWeekPromise } = useCallablePromise((payload: CreateWeekPayload) =>
    DansshipAPI.schedulesAdmin.createWeek(payload),
  );
  const { call: publishWeekPromise } = useCallablePromise((weekId: string) =>
    DansshipAPI.schedulesAdmin.publishWeek(weekId),
  );
  const { call: addClassPromise, isLoading: isAdding } = useCallablePromise((payload: AddClassPayload) =>
    DansshipAPI.schedulesAdmin.addClass(payload),
  );
  const { call: updateClassPromise, isLoading: isUpdating } = useCallablePromise(
    (weekId: string, classId: string, payload: UpdateClassPayload) =>
      DansshipAPI.schedulesAdmin.updateClass(weekId, classId, payload),
  );
  const { call: removeClassPromise, isLoading: isRemoving } = useCallablePromise((weekId: string, classId: string) =>
    DansshipAPI.schedulesAdmin.removeClass(weekId, classId),
  );
  const { call: editPublishedClassPromise, isLoading: isEditing } = useCallablePromise(
    (weekId: string, classId: string, payload: EditPublishedClassPayload) =>
      DansshipAPI.schedulesAdmin.editPublishedClass(weekId, classId, payload),
  );
  const { call: cancelPublishedClassPromise, isLoading: isCanceling } = useCallablePromise(
    (weekId: string, classId: string) => DansshipAPI.schedulesAdmin.cancelPublishedClass(weekId, classId),
  );
  const { call: updateWaitlistConfigPromise, isLoading: isUpdatingWaitlist } = useCallablePromise(
    (classId: string, payload: UpdateWaitlistConfigPayload) =>
      DansshipAPI.schedulesAdmin.updateWaitlistConfig(classId, payload),
  );

  const createWeek = useCallback(
    async (payload: CreateWeekPayload) => {
      const { ok, data } = await createWeekPromise(payload);

      if (ok) {
        toast.success(t('schedules:weekCreated'));
      } else {
        toast.error(t('schedules:weekCreateFailed'));
      }

      return data;
    },
    [t, createWeekPromise],
  );
  const publishWeek = useCallback(
    async (weekId: string) => {
      const { ok, data } = await publishWeekPromise(weekId);

      if (ok) {
        toast.success(t('schedules:publishedSuccess'));
      } else {
        toast.error(t('schedules:publishFailed'));
      }

      return data;
    },
    [t, publishWeekPromise],
  );
  const addClass = useCallback(
    async (payload: AddClassPayload) => {
      const { ok, data } = await addClassPromise(payload);

      if (ok) {
        toast.success(t('schedules:classAdded'));
      } else {
        toast.error(t('schedules:classAddFailed'));
      }

      return data;
    },
    [t, addClassPromise],
  );
  const updateClass = useCallback(
    async (weekId: string, classId: string, payload: UpdateClassPayload) => {
      const { ok, data } = await updateClassPromise(weekId, classId, payload);

      if (ok) {
        toast.success(t('schedules:classUpdated'));
      } else {
        toast.error(t('schedules:classUpdateFailed'));
      }

      return data;
    },
    [t, updateClassPromise],
  );
  const removeClass = useCallback(
    async (weekId: string, classId: string) => {
      const { ok, data } = await removeClassPromise(weekId, classId);

      if (ok) {
        toast.success(t('schedules:classRemoved'));
      } else {
        toast.error(t('schedules:classRemoveFailed'));
      }

      return data;
    },
    [t, removeClassPromise],
  );
  const editPublishedClass = useCallback(
    async (weekId: string, classId: string, payload: EditPublishedClassPayload) => {
      const { ok, data } = await editPublishedClassPromise(weekId, classId, payload);

      if (ok) {
        toast.success(t('schedules:classUpdated'));
      } else {
        toast.error(t('schedules:classUpdateFailed'));
      }

      return data;
    },
    [t, editPublishedClassPromise],
  );
  const cancelPublishedClass = useCallback(
    async (weekId: string, classId: string) => {
      const { ok, data } = await cancelPublishedClassPromise(weekId, classId);

      if (ok) {
        toast.success(t('schedules:classCancelled'));
      } else {
        toast.error(t('schedules:classCancelFailed'));
      }

      return data;
    },
    [t, cancelPublishedClassPromise],
  );
  const updateWaitlistConfig = useCallback(
    async (classId: string, payload: UpdateWaitlistConfigPayload) => {
      const { ok, data } = await updateWaitlistConfigPromise(classId, payload);

      if (ok) {
        toast.success(t('schedules:waitlistConfigUpdated'));
      } else {
        toast.error(t('schedules:waitlistConfigFailed'));
      }

      return data;
    },
    [t, updateWaitlistConfigPromise],
  );

  return {
    weeks: weeks?.data ?? [],
    isLoadingWeeks,
    activeWeekDetail: weekDetails?.data ?? null,
    isLoadingWeekDetails,
    waitlistDefaultConfig: waitlistDefaults?.data ?? null,
    createWeek,
    publishWeek,
    addClass,
    updateClass,
    removeClass,
    editPublishedClass,
    cancelPublishedClass,
    updateWaitlistConfig,
    isCreatingClass: isAdding,
    isUpdatingClass: isUpdating,
    isEditingPublishedClass: isEditing,
    isCancellingPublishedClass: isCanceling,
    isUpdatingWaitlistConfig: isUpdatingWaitlist,
    isRemovingClass: isRemoving,
  };
};
