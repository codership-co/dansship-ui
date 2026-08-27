import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { CreateCampaignPayload, DansshipAPI, UpdateCampaignPayload } from '@core/api';

export const useCampaigns = () => {
  const { t } = useTranslation();

  const { response: campaignsResponse, isLoading, reFetch } = usePromise(() => DansshipAPI.campaignsAdmin.list());
  const { response: typesResponse, isLoading: isLoadingTypes } = usePromise(() =>
    DansshipAPI.campaignsAdmin.listStructuredTypes(),
  );
  const { call: createPromise, isLoading: isCreating } = useCallablePromise((payload: CreateCampaignPayload) =>
    DansshipAPI.campaignsAdmin.create(payload),
  );
  const { call: updatePromise, isLoading: isUpdating } = useCallablePromise(
    (id: string, payload: UpdateCampaignPayload) => DansshipAPI.campaignsAdmin.update(id, payload),
  );
  const { call: deactivatePromise, isLoading: isDeactivating } = useCallablePromise((id: string) =>
    DansshipAPI.campaignsAdmin.deactivate(id),
  );
  const { call: reactivatePromise, isLoading: isReactivating } = useCallablePromise((id: string) =>
    DansshipAPI.campaignsAdmin.reactivate(id),
  );

  const createCampaign = useCallback(
    async (payload: CreateCampaignPayload) => {
      const { ok } = await createPromise(payload);

      if (ok) {
        toast.success(t('campaigns:admin.createSuccess'));
        reFetch();
      } else {
        toast.error(t('campaigns:admin.createFailed'));
      }

      return ok;
    },
    [createPromise, reFetch, t],
  );

  const updateCampaign = useCallback(
    async (id: string, payload: UpdateCampaignPayload) => {
      const { ok } = await updatePromise(id, payload);

      if (ok) {
        toast.success(t('campaigns:admin.updateSuccess'));
        reFetch();
      } else {
        toast.error(t('campaigns:admin.updateFailed'));
      }

      return ok;
    },
    [reFetch, t, updatePromise],
  );

  const deactivateCampaign = useCallback(
    async (id: string) => {
      const { ok } = await deactivatePromise(id);

      if (ok) {
        toast.success(t('campaigns:admin.deactivateSuccess'));
        reFetch();
      } else {
        toast.error(t('campaigns:admin.deactivateFailed'));
      }
    },
    [deactivatePromise, reFetch, t],
  );

  const reactivateCampaign = useCallback(
    async (id: string) => {
      const { ok } = await reactivatePromise(id);

      if (ok) {
        toast.success(t('campaigns:admin.reactivateSuccess'));
        reFetch();
      } else {
        toast.error(t('campaigns:admin.reactivateFailed'));
      }
    },
    [reactivatePromise, reFetch, t],
  );

  return {
    campaigns: campaignsResponse?.data ?? [],
    structuredTypes: typesResponse?.data ?? [],
    isLoading,
    isLoadingTypes,
    createCampaign,
    updateCampaign,
    deactivateCampaign,
    reactivateCampaign,
    isCreating,
    isUpdating,
    isDeactivating,
    isReactivating,
  };
};
