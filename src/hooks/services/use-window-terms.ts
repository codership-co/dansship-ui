import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { DansshipAPI, type PromotionWindowTerms } from '@core/api';

const EMPTY_TERMS: Array<PromotionWindowTerms> = [];

/** Terms PDF of the promotion windows (only promotions can carry terms) and the save/history calls. */
export const useWindowTerms = () => {
  const { t } = useTranslation();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.benefitsAdmin.listPromotionWindowTerms());
  const { call: savePromise, isLoading: isSaving } = useCallablePromise(
    async (definitionId: string, title: string, file: File | null) => {
      // The PDF goes straight to the bucket first; saving only sends its key.
      const fileKey = file ? await DansshipAPI.benefitsAdmin.uploadWindowTermsPdf(definitionId, file) : null;

      return DansshipAPI.benefitsAdmin.saveWindowTerms(definitionId, { title, file_key: fileKey });
    },
  );
  const { call: versionsPromise, isLoading: isLoadingVersions } = useCallablePromise((definitionId: string) =>
    DansshipAPI.benefitsAdmin.listWindowTermsVersions(definitionId),
  );

  const saveTerms = useCallback(
    async (definitionId: string, title: string, file: File | null) => {
      const { ok } = await savePromise(definitionId, title, file).catch(() => ({ ok: false }));

      if (ok) {
        toast.success(t('admin:inventory.promotionsPanel.terms.saveSuccess'));
        reFetch();
      } else {
        toast.error(t('admin:inventory.promotionsPanel.terms.saveFailed'));
      }

      return ok;
    },
    [reFetch, savePromise, t],
  );

  const loadVersions = useCallback(
    async (definitionId: string) => {
      const { ok, data } = await versionsPromise(definitionId);

      return ok ? data : [];
    },
    [versionsPromise],
  );

  return {
    promotionTerms: response?.data ?? EMPTY_TERMS,
    isLoading,
    isSaving,
    isLoadingVersions,
    saveTerms,
    loadVersions,
  };
};
