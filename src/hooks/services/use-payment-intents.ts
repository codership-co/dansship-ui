import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import {
  type ConfirmPaymentProofPayload,
  CreatePaymentIntentPayload,
  DansshipAPI,
  PaymentProofContentType,
  type PaymentProofUploadRequest,
} from '@core/api';

export const usePaymentIntents = () => {
  const { t } = useTranslation();

  const { response, isLoading, error } = usePromise(() => DansshipAPI.payments.getMyIntents());

  const { call: createIntentPromise, isLoading: isCreatingIntent } = useCallablePromise(
    (payload: CreatePaymentIntentPayload) => DansshipAPI.payments.createIntent(payload),
  );
  const { call: cancelIntentPromise, isLoading: isCancellingIntent } = useCallablePromise((id: string) =>
    DansshipAPI.payments.cancelIntent(id),
  );
  const { call: getProofUploadUrlPromise, isLoading: isGettingProofUploadUrl } = useCallablePromise(
    (id: string, payload: PaymentProofUploadRequest) => DansshipAPI.payments.getProofUploadUrl(id, payload),
  );
  const { call: getProofViewUrlPromise, isLoading: isGettingProofViewUrl } = useCallablePromise((id: string) =>
    DansshipAPI.payments.getProofViewUrl(id),
  );
  const { call: confirmProofUploadPromise } = useCallablePromise((id: string, payload: ConfirmPaymentProofPayload) =>
    DansshipAPI.payments.confirmProofUpload(id, payload),
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

  const confirmProofUpload = useCallback(
    async (id: string, payload: ConfirmPaymentProofPayload) => {
      const { error } = await confirmProofUploadPromise(id, payload);

      if (error) {
        toast.error(t('payments:proofUploadFailedDesc'));
      } else {
        toast.success(t('payments:proofUploadSuccess'));
      }
    },
    [confirmProofUploadPromise, t],
  );

  const getProofUploadUrl = useCallback(
    async (id: string, file: File) => {
      try {
        const { data } = await getProofUploadUrlPromise(id, {
          content_type: file.type as PaymentProofContentType,
        });

        if (data) {
          const { upload_url, file_key } = data;

          const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file,
          });

          if (!uploadResponse.ok) {
            toast.error(t('payments:proofUploadFailedDesc'));
          }

          await confirmProofUpload(id, { file_key });
        }
      } catch {
        toast.error(t('payments:proofUploadFailedDesc'));
      }
    },
    [confirmProofUpload, getProofUploadUrlPromise, t],
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
    getProofUploadUrl,
    getProofViewUrl,
    isCreatingIntent,
    isCancellingIntent,
    isGettingProofUploadUrl,
    isGettingProofViewUrl,
  };
};
