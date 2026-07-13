import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { CreatePaymentIntentPayload, DansshipAPI } from '@core/api';

export const usePaymentIntents = () => {
  const { t } = useTranslation();

  const { response, isLoading, error } = usePromise(() => DansshipAPI.payments.getMyIntents());

  const { call: createIntentPromise, isLoading: isCreatingIntent } = useCallablePromise(
    (payload: CreatePaymentIntentPayload) => DansshipAPI.payments.createIntent(payload),
  );
  const { call: cancelIntentPromise, isLoading: isCancellingIntent } = useCallablePromise((id: string) =>
    DansshipAPI.payments.cancelIntent(id),
  );
  const { call: uploadProofPromise, isLoading: isUploadingProof } = useCallablePromise((id: string, file: File) =>
    DansshipAPI.payments.uploadProof(id, file),
  );
  const { call: uploadAdminProofPromise, isLoading: isAdminUploadingProof } = useCallablePromise(
    (id: string, file: File) => DansshipAPI.paymentsAdmin.uploadAdminProof(id, file),
  );
  const { call: getProofViewUrlPromise, isLoading: isGettingProofViewUrl } = useCallablePromise((id: string) =>
    DansshipAPI.payments.getProofViewUrl(id),
  );

  const createIntent = useCallback(
    async (payload: CreatePaymentIntentPayload) => {
      const { error } = await createIntentPromise(payload);

      if (error) {
        toast.error(t('payments:createFailedDesc'));
      } else {
        toast.success(t('payments:createSuccess'));
      }
    },
    [createIntentPromise, t],
  );

  const cancelIntent = useCallback(
    async (id: string) => {
      const { error } = await cancelIntentPromise(id);

      if (error) {
        toast.error(t('payments:cancelFailedDesc'));
      } else {
        toast.success(t('payments:cancelSuccess'));
      }
    },
    [cancelIntentPromise, t],
  );

  const uploadProof = useCallback(
    async (id: string, file: File) => {
      try {
        await uploadProofPromise(id, file);
        toast.success(t('payments:proofUploadSuccess'));
      } catch {
        toast.error(t('payments:proofUploadFailedDesc'));
      }
    },
    [uploadProofPromise, t],
  );

  const uploadAdminProof = useCallback(
    async (id: string, file: File) => {
      try {
        await uploadAdminProofPromise(id, file);
        toast.success(t('payments:proofUploadSuccess'));
      } catch {
        toast.error(t('payments:proofUploadFailedDesc'));
      }
    },
    [uploadAdminProofPromise, t],
  );

  const getProofViewUrl = useCallback(
    async (id: string) => {
      const { data, error } = await getProofViewUrlPromise(id);

      if (error) {
        toast.error(t('payments:proofViewFailedDesc'));
      } else {
        window.open(data.view_url, '_blank', 'noopener,noreferrer');
      }
    },
    [getProofViewUrlPromise, t],
  );

  return {
    intents: response?.data ?? [],
    isLoading,
    error,
    createIntent,
    cancelIntent,
    uploadProof,
    uploadAdminProof,
    getProofViewUrl,
    isCreatingIntent,
    isCancellingIntent,
    isUploadingProof,
    isAdminUploadingProof,
    isGettingProofViewUrl,
  };
};
