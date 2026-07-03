import { format } from 'date-fns';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft } from 'react-icons/lu';
import { MdOutlinePayments } from 'react-icons/md';
import { toast } from 'sonner';

import { CheckoutFormValues } from '@components/forms/checkout-review-plan-form';
import { Button } from '@components/ui';
import {
  type ConfirmPaymentProofPayload,
  type CreatePaymentIntentPayload,
  DansshipAPI,
  type PaymentMethodType,
  PaymentProofContentType,
  type PaymentProofUploadRequest,
  PublicPlan,
  openBoldEmbeddedCheckout,
} from '@core/api';
import { formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

const fileAccept = `${PaymentProofContentType.JPEG},${PaymentProofContentType.PNG},${PaymentProofContentType.WEBP}`;

interface CheckoutPaymentProofFormProps {
  plan: PublicPlan;
  paymentMethod: PaymentMethodType;
  finalPrice: number;
  requiresProof: boolean;
  onClose: () => void;
  onBack: () => void;
  checkoutData: CheckoutFormValues;
  onSubmit: (intentId: string) => void;
}

export function CheckoutPaymentProofForm({
  plan,
  paymentMethod,
  finalPrice,
  requiresProof,
  onClose,
  onBack,
  checkoutData,
  onSubmit,
}: CheckoutPaymentProofFormProps) {
  const { t } = useTranslation();
  const { call: createIntent, isLoading: isCreating } = useCallablePromise((payload: CreatePaymentIntentPayload) =>
    DansshipAPI.payments.createIntent(payload),
  );
  const { call: createBoldCheckout, isLoading: isCreatingBoldCheckout } = useCallablePromise(
    (payload: CreatePaymentIntentPayload) => DansshipAPI.payments.createBoldCheckout(payload),
  );
  const { call: getProofUploadUrl, isLoading: isGettingProofUploadUrl } = useCallablePromise(
    (id: string, payload: PaymentProofUploadRequest) => DansshipAPI.payments.getProofUploadUrl(id, payload),
  );
  const { call: confirmProofUpload, isLoading: isConfirmingProofUpload } = useCallablePromise(
    (id: string, payload: ConfirmPaymentProofPayload) => DansshipAPI.payments.confirmProofUpload(id, payload),
  );
  const isUploadingProof = isGettingProofUploadUrl || isConfirmingProofUpload;
  const isCardMethod = paymentMethod === 'card';
  const isBusy = isCreating || isCreatingBoldCheckout || isUploadingProof;
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const onConfirm = async () => {
    if (requiresProof && !selectedProofFile) {
      toast.error(t('payments:proofRequiredTitle'));

      return;
    }

    const { start_date, discount_code } = checkoutData;

    const payload: CreatePaymentIntentPayload = {
      plan_id: plan.id,
      payment_method_type: paymentMethod,
      discount_code: discount_code.trim() ? discount_code.trim() : undefined,
      start_date: start_date.toISOString(),
    };

    if (isCardMethod) {
      const { data, ok } = await createBoldCheckout(payload);

      if (!ok) {
        toast.error(t('payments:createFailedDesc'));

        return;
      }

      try {
        onClose();

        // Allow the dialog to unmount first so Bold modal is not blocked by another layer.
        setTimeout(() => {
          void openBoldEmbeddedCheckout(data.checkout).catch(() => {
            toast.error(t('payments:boldLoadFailed'));
          });
        }, 0);
      } catch {
        toast.error(t('payments:boldLoadFailed'));
      }

      return;
    }

    const { data: intent, ok } = await createIntent(payload);

    if (ok) {
      if (requiresProof && selectedProofFile) {
        try {
          const { data, ok } = await getProofUploadUrl(intent.id, {
            content_type: selectedProofFile.type as PaymentProofContentType,
          });

          if (ok) {
            const uploadResponse = await fetch(data.upload_url, {
              method: 'PUT',
              headers: {
                'Content-Type': selectedProofFile.type,
              },
              body: selectedProofFile,
            });

            if (!uploadResponse.ok) {
              throw new Error('S3_UPLOAD_FAILED');
            }

            await confirmProofUpload(intent.id, { file_key: data.file_key });
          }
        } catch {
          toast.error(t('payments:proofUploadFailed'));
        }
      }

      onSubmit(intent.id);
    }
  };

  const handleInputFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

    if (!isValidType) {
      toast.error(t('payments:proofInvalidTypeTitle'));
      event.currentTarget.value = '';

      return;
    }

    setImageUrl(URL.createObjectURL(file));
    setSelectedProofFile(file);
    event.currentTarget.value = '';
  };

  return (
    <div className='grid grid-rows-[1fr_auto] h-full'>
      <section className='grid gap-8 content-start'>
        <section className='grid lg:grid-cols-2 gap-8'>
          <div className='rounded-md border border-secondary bg-secondary-400/40 py-2 px-4'>
            <label className='block'>{plan.name}</label>
            <label className='block'>
              {t('payments:total')}: {formatPrice(finalPrice, plan.currency)}
            </label>
            <label className='block'>
              {t('payments:startDate')}: {format(checkoutData.start_date, 'yyyy-MM-dd')}
            </label>
          </div>

          <div className='rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-gray-700'>
            <p className='font-semibold text-primary'>{t(`payments:instructions.${paymentMethod}.title`)}</p>
            <p className='mt-1'>{t(`payments:instructions.${paymentMethod}.description`)}</p>
          </div>
        </section>

        {requiresProof ? (
          <div className='grid lg:grid-cols-2 gap-8 rounded-md border border-dashed border-gray-300 p-3'>
            <section>
              <p className='text-sm font-medium text-gray-900'>{t('payments:proofUploadInCheckoutTitle')}</p>
              <p className='text-xs text-gray-600'>{t('payments:proofUploadInCheckoutDesc')}</p>
              <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground'>
                {selectedProofFile ? t('payments:replaceProof') : t('payments:uploadProof')}
                <input type='file' className='hidden' accept={fileAccept} onChange={handleInputFileUpload} />
              </label>
            </section>
            <section>
              {selectedProofFile && <p className='text-xs text-gray-600'>{selectedProofFile.name}</p>}
              <section className='relative w-full max-w-md aspect-square bg-gray-300/50 border border-dashed border-gray-300 rounded-xl grid place-content-center overflow-hidden'>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt='proof preview'
                    className='w-full aspect-square inline-block object-contain '
                  />
                ) : (
                  <label className='p-8 text-center'>{t('payments:proofRequiredInline')}</label>
                )}
                <input
                  type='file'
                  className='absolute w-full h-full cursor-pointer opacity-0'
                  accept={fileAccept}
                  onChange={handleInputFileUpload}
                />
              </section>
            </section>
          </div>
        ) : null}
      </section>

      <div className='flex justify-end gap-2 pt-4'>
        <Button type='button' className='flex items-center' variant='outline' onClick={onBack}>
          <LuArrowLeft />
          {t('common:back')}
        </Button>

        <Button
          type='submit'
          disabled={isBusy || (requiresProof && !selectedProofFile)}
          onClick={() => onConfirm()}
          className='flex items-center'
        >
          {isBusy ? t('subscriptions:processing') : t('payments:confirmPurchase')}
          <MdOutlinePayments />
        </Button>
      </div>
    </div>
  );
}
