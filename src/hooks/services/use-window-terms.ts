import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError, type PromotionWindowTerms } from '@core/api';
import { captureUnexpectedException } from '@core/sentry';

const EMPTY_TERMS: Array<PromotionWindowTerms> = [];

const isRejectedTerms = (error: unknown) =>
  error instanceof DansshipAPIError && error.body.error_code === DANSSHIP_ERROR_CODE.PROMOTION_TERMS_INVALID;

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
      // The upload throws and the save returns its error: both end up here, so the admin sees why and Sentry sees it.
      const { ok, error } = await savePromise(definitionId, title, file).then(
        result => ({ ok: result.ok, error: result.error }),
        (uploadError: unknown) => ({ ok: false, error: uploadError }),
      );

      if (ok) {
        toast.success(t('admin:inventory.promotionsPanel.terms.saveSuccess'));
        reFetch();
      } else {
        toast.error(
          isRejectedTerms(error)
            ? t(`errors:codes.${DANSSHIP_ERROR_CODE.PROMOTION_TERMS_INVALID}`)
            : t('admin:inventory.promotionsPanel.terms.saveFailed'),
        );
        captureUnexpectedException(error ?? new Error('Promotion terms save failed'), {
          tags: { flow: 'admin.promotionTerms.save', definition_id: definitionId },
        });
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
