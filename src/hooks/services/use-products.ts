import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { CreateProductPayload, DansshipAPI, UpdateProductPayload } from '@core/api';

export const useProducts = () => {
  const { t } = useTranslation();

  const { call: createProductPromise, isLoading: isCreating } = useCallablePromise((payload: CreateProductPayload) =>
    DansshipAPI.merchAdmin.createProduct(payload),
  );

  const createProduct = useCallback(
    async (payload: CreateProductPayload) => {
      const { data, ok } = await createProductPromise(payload);

      if (ok) {
        toast.success(t('merch:productCreated'));
      } else {
        toast.error(t('merch:errors.productCreateFailed'));
      }

      return data;
    },
    [createProductPromise, t],
  );

  const { call: updateProductPromise, isLoading: isUpdating } = useCallablePromise(
    (id: string, payload: UpdateProductPayload) => DansshipAPI.merchAdmin.updateProduct(id, payload),
  );

  const updateProduct = useCallback(
    async (id: string, payload: UpdateProductPayload) => {
      const { data, ok } = await updateProductPromise(id, payload);

      if (ok) {
        toast.success(t('merch:productUpdated'));
      } else {
        toast.error(t('merch:errors.productUpdateFailed'));
      }

      return data;
    },
    [updateProductPromise, t],
  );

  const { call: deactivateProductPromise, isLoading: isDeactivating } = useCallablePromise((id: string) =>
    DansshipAPI.merchAdmin.deactivateProduct(id),
  );

  const deactivateProduct = useCallback(
    async (id: string) => {
      const { data, ok } = await deactivateProductPromise(id);

      if (ok) {
        toast.success(t('merch:productDeactivated'));
      } else {
        toast.error(t('merch:errors.productDeactivateFailed'));
      }

      return data;
    },
    [deactivateProductPromise, t],
  );

  const { call: reactivateProductPromise, isLoading: isReactivating } = useCallablePromise((id: string) =>
    DansshipAPI.merchAdmin.reactivateProduct(id),
  );

  const reactivateProduct = useCallback(
    async (id: string) => {
      const { data, ok } = await reactivateProductPromise(id);

      if (ok) {
        toast.success(t('merch:productReactivated'));
      } else {
        toast.error(t('merch:errors.productReactivateFailed'));
      }

      return data;
    },
    [reactivateProductPromise, t],
  );

  return {
    createProduct,
    isCreating,
    updateProduct,
    isUpdating,
    deactivateProduct,
    isDeactivating,
    reactivateProduct,
    isReactivating,
  };
};
