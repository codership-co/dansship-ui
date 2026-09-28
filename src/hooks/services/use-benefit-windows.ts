import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { DansshipAPI, type UpdateBenefitWindowPayload } from '@core/api';

export const useBenefitWindows = () => {
  const { t } = useTranslation();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.benefitsAdmin.listWindows());
  const { call: updatePromise, isLoading: isSaving } = useCallablePromise(
    (id: string, payload: UpdateBenefitWindowPayload) => DansshipAPI.benefitsAdmin.updateWindow(id, payload),
  );

  const updateWindow = useCallback(
    async (id: string, payload: UpdateBenefitWindowPayload) => {
      const { ok } = await updatePromise(id, payload);

      if (ok) {
        toast.success(t('admin:inventory.promotionsPanel.saveSuccess'));
        reFetch();
      } else {
        toast.error(t('admin:inventory.promotionsPanel.saveFailed'));
      }

      return ok;
    },
    [reFetch, t, updatePromise],
  );

  return {
    windows: response?.data ?? [],
    isLoading,
    isSaving,
    updateWindow,
  };
};
