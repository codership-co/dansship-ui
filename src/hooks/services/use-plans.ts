import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { CreatePlanPayload, DansshipAPI, UpdatePlanPayload } from '@core/api';

export const usePlans = () => {
  const { t } = useTranslation();

  const { response: plans, isLoading } = usePromise(() => DansshipAPI.billingAdmin.getPlans());
  const { call: createPlanPromise, isLoading: isCreatingPlan } = useCallablePromise((payload: CreatePlanPayload) =>
    DansshipAPI.billingAdmin.createPlan(payload),
  );
  const { call: updatePlanPromise, isLoading: isUpdatingPlan } = useCallablePromise(
    (id: string, payload: UpdatePlanPayload) => DansshipAPI.billingAdmin.updatePlan(id, payload),
  );
  const { call: deletePlanPromise, isLoading: isDeletingPlan } = useCallablePromise((id: string) =>
    DansshipAPI.billingAdmin.deletePlan(id),
  );
  const { call: reactivatePlanPromise, isLoading: isReactivatingPlan } = useCallablePromise((id: string) =>
    DansshipAPI.billingAdmin.reactivatePlan(id),
  );

  const createPlan = useCallback(
    async (payload: CreatePlanPayload) => {
      const { ok } = await createPlanPromise(payload);

      if (ok) {
        toast.success(t('billing:planCreated'));
      } else {
        toast.error(t('billing:planCreateFailed'));
      }
    },
    [t, createPlanPromise],
  );

  const updatePlan = useCallback(
    async (id: string, payload: UpdatePlanPayload) => {
      const { ok } = await updatePlanPromise(id, payload);

      if (ok) {
        toast.success(t('billing:planUpdated'));
      } else {
        toast.error(t('billing:planUpdateFailed'));
      }
    },
    [t, updatePlanPromise],
  );

  const deletePlan = useCallback(
    async (id: string) => {
      const { ok } = await deletePlanPromise(id);

      if (ok) {
        toast.success(t('billing:planDeactivated'));
      } else {
        toast.error(t('billing:planDeactivateFailed'));
      }
    },
    [t, deletePlanPromise],
  );

  const reactivatePlan = useCallback(
    async (id: string) => {
      const { ok } = await reactivatePlanPromise(id);

      if (ok) {
        toast.success(t('billing:planReactivated'));
      } else {
        toast.error(t('billing:planReactivateFailed'));
      }
    },
    [t, reactivatePlanPromise],
  );

  return {
    plans: plans?.data ?? [],
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    reactivatePlan,
    isCreating: isCreatingPlan,
    isUpdating: isUpdatingPlan,
    isDeleting: isDeletingPlan,
    isReactivating: isReactivatingPlan,
  };
};
