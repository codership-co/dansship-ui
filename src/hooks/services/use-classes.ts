import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { CreateClassDefinitionPayload, DansshipAPI, UpdateClassDefinitionPayload } from '@core/api';

export const useClasses = () => {
  const { t } = useTranslation();

  const { response: classes, isLoading } = usePromise(() => DansshipAPI.inventoryAdmin.getClasses());
  const { call: createClassPromise, isLoading: isCreatingClass } = useCallablePromise(
    (payload: CreateClassDefinitionPayload) => DansshipAPI.inventoryAdmin.createClass(payload),
  );
  const { call: updateClassPromise, isLoading: isUpdatingClass } = useCallablePromise(
    (id: string, payload: UpdateClassDefinitionPayload) => DansshipAPI.inventoryAdmin.updateClass(id, payload),
  );
  const { call: deleteClassPromise, isLoading: isDeletingClass } = useCallablePromise((id: string) =>
    DansshipAPI.inventoryAdmin.deleteClass(id),
  );
  const { call: reactivateClassPromise, isLoading: isReactivatingClass } = useCallablePromise((id: string) =>
    DansshipAPI.inventoryAdmin.reactivateClass(id),
  );

  const createClass = useCallback(
    async (payload: CreateClassDefinitionPayload) => {
      const { ok } = await createClassPromise(payload);

      if (ok) {
        toast.success(t('inventory:classes.createSuccess'));
      } else {
        toast.error(t('inventory:classes.createFailed'));
      }
    },
    [t, createClassPromise],
  );

  const updateClass = useCallback(
    async (id: string, payload: UpdateClassDefinitionPayload) => {
      const { ok } = await updateClassPromise(id, payload);

      if (ok) {
        toast.success(t('inventory:classes.updateSuccess'));
      } else {
        toast.error(t('inventory:classes.updateFailed'));
      }
    },
    [t, updateClassPromise],
  );

  const deleteClass = useCallback(
    async (id: string) => {
      const { ok } = await deleteClassPromise(id);

      if (ok) {
        toast.success(t('inventory:classes.deactivateSuccess'));
      } else {
        toast.error(t('inventory:classes.deactivateFailed'));
      }
    },
    [t, deleteClassPromise],
  );

  const reactivateClass = useCallback(
    async (id: string) => {
      const { ok } = await reactivateClassPromise(id);

      if (ok) {
        toast.success(t('inventory:classes.reactivateSuccess'));
      } else {
        toast.error(t('inventory:classes.reactivateFailed'));
      }
    },
    [t, reactivateClassPromise],
  );

  return {
    classes: classes?.data ?? [],
    isLoading,
    createClass,
    updateClass,
    deleteClass,
    reactivateClass,
    isCreating: isCreatingClass,
    isUpdating: isUpdatingClass,
    isDeleting: isDeletingClass,
    isReactivating: isReactivatingClass,
  };
};
