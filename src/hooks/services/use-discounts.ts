import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { CreateDiscountPayload, DansshipAPI, UpdateDiscountPayload } from '@core/api';

export const useDiscounts = () => {
  const { t } = useTranslation();

  const { response: discounts, isLoading } = usePromise(() => DansshipAPI.billingAdmin.getDiscounts());
  const { call: createDiscountPromise, isLoading: isCreatingDiscount } = useCallablePromise(
    (payload: CreateDiscountPayload) => DansshipAPI.billingAdmin.createDiscount(payload),
  );
  const { call: updateDiscountPromise, isLoading: isUpdatingDiscount } = useCallablePromise(
    (id: string, payload: UpdateDiscountPayload) => DansshipAPI.billingAdmin.updateDiscount(id, payload),
  );
  const { call: deleteDiscountPromise, isLoading: isDeletingDiscount } = useCallablePromise((id: string) =>
    DansshipAPI.billingAdmin.deleteDiscount(id),
  );
  const { call: reactivateDiscountPromise, isLoading: isReactivatingDiscount } = useCallablePromise((id: string) =>
    DansshipAPI.billingAdmin.reactivateDiscount(id),
  );

  const createDiscount = useCallback(
    async (payload: CreateDiscountPayload) => {
      const { ok } = await createDiscountPromise(payload);

      if (ok) {
        toast.success(t('billing:discountCreated'));
      } else {
        toast.error(t('billing:discountCreateFailed'));
      }
    },
    [t, createDiscountPromise],
  );

  const updateDiscount = useCallback(
    async (id: string, payload: UpdateDiscountPayload) => {
      const { ok } = await updateDiscountPromise(id, payload);

      if (ok) {
        toast.success(t('billing:discountUpdated'));
      } else {
        toast.error(t('billing:discountUpdateFailed'));
      }
    },
    [t, updateDiscountPromise],
  );

  const deleteDiscount = useCallback(
    async (id: string) => {
      const { ok } = await deleteDiscountPromise(id);

      if (ok) {
        toast.success(t('billing:discountDeactivated'));
      } else {
        toast.error(t('billing:discountDeactivateFailed'));
      }
    },
    [t, deleteDiscountPromise],
  );

  const reactivateDiscount = useCallback(
    async (id: string) => {
      const { ok } = await reactivateDiscountPromise(id);

      if (ok) {
        toast.success(t('billing:discountReactivated'));
      } else {
        toast.error(t('billing:discountReactivateFailed'));
      }
    },
    [t, reactivateDiscountPromise],
  );

  return {
    discounts: discounts?.data ?? [],
    isLoading,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    reactivateDiscount,
    isCreating: isCreatingDiscount,
    isUpdating: isUpdatingDiscount,
    isDeleting: isDeletingDiscount,
    isReactivating: isReactivatingDiscount,
  };
};
