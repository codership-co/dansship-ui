import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { DansshipAPI, DansshipAPIError, INSTALLMENT_PROOF_CONTENT_TYPES } from '@core/api';
import { usePromise } from '@hooks';

export interface ManualPaymentDetails {
  paidOn?: string;
  note?: string;
}

interface UseManualInstallmentPaymentParams {
  eventId: string;
  /** The person the payment is registered for; nothing is quoted until it is known. */
  userId: string;
  enabled?: boolean;
  onRegistered: () => void;
}

export function sameSequences(left: Array<number>, right: Array<number>) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

/** Quote, option choice, proof upload and confirmation of an installment payment an admin registers by hand. */
export function useManualInstallmentPayment({
  eventId,
  userId,
  enabled = true,
  onRegistered,
}: UseManualInstallmentPaymentParams) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Array<number>>([]);
  const [proof, setProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const { response: quote, isLoading: isQuoteLoading } = usePromise(
    () => DansshipAPI.eventosAdmin.quoteInstallments(eventId, userId),
    enabled && Boolean(eventId && userId),
    [eventId, userId, enabled],
  );
  const options = quote?.data?.payment_options ?? [];
  const quoteError = quote && !quote.ok ? quote.error : null;
  const quoteErrorCode = quoteError instanceof DansshipAPIError ? quoteError.body.error_code : null;
  const selectedOption = options.find(option => sameSequences(option.sequences, selected));

  useEffect(() => {
    setSelected(quote?.data?.default_sequences ?? []);
  }, [quote?.data]);

  const proofAccept = useMemo(() => INSTALLMENT_PROOF_CONTENT_TYPES.join(','), []);

  const reset = useCallback(() => {
    setSelected(quote?.data?.default_sequences ?? []);
    setProof(null);
    setPreviewUrl(null);
    setIsSubmitting(false);
    setIdempotencyKey(crypto.randomUUID());
  }, [quote?.data?.default_sequences]);

  const chooseProof = (file: File | null) => {
    if (!file) {
      return;
    }

    if (!INSTALLMENT_PROOF_CONTENT_TYPES.includes(file.type as (typeof INSTALLMENT_PROOF_CONTENT_TYPES)[number])) {
      toast.error(t('payments:proofInvalidTypeDesc'));

      return;
    }

    setProof(file);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
  };

  const submit = async (file: File | null = proof, details: ManualPaymentDetails = {}) => {
    if (!file || !userId || !selectedOption) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const uploaded = await DansshipAPI.eventosAdmin.uploadInstallmentProof(file);

      if (!uploaded.data?.file_key) {
        const code = uploaded.error instanceof DansshipAPIError ? uploaded.error.body.error_code : '';
        toast.error(code || t('eventos:admin.installmentPaymentFailed'));

        return false;
      }

      const confirmed = await DansshipAPI.eventosAdmin.confirmInstallmentPayment(eventId, {
        user_id: userId,
        sequences: [...selected].sort((left, right) => left - right),
        proof_key: uploaded.data.file_key,
        idempotency_key: idempotencyKey,
        paid_on: details.paidOn || undefined,
        note: details.note?.trim() || undefined,
      });

      if (!confirmed.ok) {
        const code = confirmed.error instanceof DansshipAPIError ? confirmed.error.body.error_code : '';
        toast.error(code || t('eventos:admin.installmentPaymentFailed'));

        return false;
      }

      toast.success(t('eventos:admin.installmentPaymentSaved'));
      onRegistered();

      return true;
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      toast.error(code || t('eventos:admin.installmentPaymentFailed'));

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    lines: quote?.data?.lines ?? [],
    options,
    selected,
    selectedOption,
    setSelected,
    isQuoteLoading,
    quoteErrorCode,
    proof,
    previewUrl,
    proofAccept,
    chooseProof,
    isSubmitting,
    canSubmit: Boolean(userId && proof && selectedOption && !isSubmitting),
    submit,
    reset,
  };
}

/** Stable value for a payment option; a one-payment event has no installment sequences. */
export function installmentOptionKey(option: { sequences: Array<number> }) {
  return option.sequences.join('-') || 'full';
}

export function installmentOptionLabel(
  option: { sequences: Array<number>; amount: string | number },
  t: (key: string, values: Record<string, unknown>) => string,
  formatAmount: (amount: number) => string,
) {
  const amount = formatAmount(Number(option.amount));

  if (option.sequences.length === 0) {
    return t('eventos:admin.payFullOption', { amount });
  }

  return option.sequences.length > 1
    ? t('eventos:admin.payTotalOption', { amount })
    : t('eventos:admin.payInstallmentOption', { sequence: option.sequences[0], amount });
}
