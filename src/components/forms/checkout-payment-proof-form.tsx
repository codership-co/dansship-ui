import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { ChangeEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft } from 'react-icons/lu';
import { MdOutlinePayments } from 'react-icons/md';
import { toast } from 'sonner';

import { CheckoutFormValues } from '@components/forms/checkout-review-plan-form';
import { TransferPaymentInstructions } from '@components/modules/payments/transfer-payment-instructions';
import {
  type CreatePaymentIntentPayload,
  DansshipAPI,
  openBoldEmbeddedCheckout,
  PaymentMethod,
  PaymentProofContentType,
  PaymentProofContentTypesList,
  PublicPlan,
} from '@core/api';
import { addSentryBreadcrumb, captureUnexpectedException, withSentrySpan } from '@core/sentry';
import { cn, formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

interface CheckoutPaymentProofFormProps {
  plan?: PublicPlan;
  paymentMethod: PaymentMethod;
  finalPrice: number;
  amountToCharge: number;
  walletAmountApplied: number;
  onClose: () => void;
  onBack: () => void;
  checkoutData?: CheckoutFormValues;
  onSubmit: (intentId: string) => void;
  summaryTitle?: string;
  currency?: string;
  onCreateIntent?: () => Promise<string | null>;
}

export function CheckoutPaymentProofForm({
  plan,
  paymentMethod,
  finalPrice,
  amountToCharge,
  walletAmountApplied,
  onClose,
  onBack,
  checkoutData,
  onSubmit,
  summaryTitle,
  currency,
  onCreateIntent,
}: CheckoutPaymentProofFormProps) {
  const { t } = useTranslation();
  const { call: createIntent, isLoading: isCreating } = useCallablePromise((payload: CreatePaymentIntentPayload) =>
    DansshipAPI.payments.createIntent(payload),
  );
  const { call: createBoldCheckout, isLoading: isCreatingBoldCheckout } = useCallablePromise(
    (payload: CreatePaymentIntentPayload) => DansshipAPI.payments.createBoldCheckout(payload),
  );
  const { call: createBoldCheckoutForIntent, isLoading: isCreatingLinkedBoldCheckout } = useCallablePromise(
    (intentId: string) => DansshipAPI.payments.createBoldCheckoutForIntent(intentId),
  );
  const { call: uploadProof, isLoading: isUploadingProof } = useCallablePromise((id: string, file: File) =>
    DansshipAPI.payments.uploadProof(id, file),
  );
  const isWalletMethod = paymentMethod === PaymentMethod.WALLET || amountToCharge === 0;
  const isCardMethod = paymentMethod === PaymentMethod.CARD && !isWalletMethod;
  const requiresProof = paymentMethod === PaymentMethod.TRANSFER && !isWalletMethod;
  const [isCreatingLinked, setIsCreatingLinked] = useState(false);
  const isBusy =
    isCreating || isCreatingBoldCheckout || isUploadingProof || isCreatingLinked || isCreatingLinkedBoldCheckout;
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const displayTitle = summaryTitle ?? plan?.name ?? '';
  const displayCurrency = currency ?? plan?.currency ?? 'COP';

  const onConfirm = async () => {
    if (requiresProof && !selectedProofFile) {
      toast.error(t('payments:proofRequiredTitle'));

      return;
    }

    if (onCreateIntent) {
      setIsCreatingLinked(true);

      try {
        const intentId = await onCreateIntent();

        if (!intentId) {
          return;
        }

        if (isCardMethod) {
          const { data, ok, error } = await withSentrySpan(
            'checkout.bold',
            'ui.action',
            { intent_id: intentId, payment_method: paymentMethod },
            () => createBoldCheckoutForIntent(intentId),
          );

          if (!ok) {
            toast.error(t('payments:createFailedDesc'));
            captureUnexpectedException(error ?? new Error('Bold checkout intent create failed'), {
              tags: { flow: 'checkout.bold', intent_id: intentId },
            });

            return;
          }

          try {
            onClose();
            addSentryBreadcrumb('checkout.bold', 'Opening Bold embedded checkout', { intent_id: intentId });

            void openBoldEmbeddedCheckout(data.checkout).catch(boldError => {
              toast.error(t('payments:boldLoadFailed'));
              captureUnexpectedException(boldError, {
                tags: { flow: 'checkout.bold.open', intent_id: intentId },
              });
            });
          } catch (boldError) {
            toast.error(t('payments:boldLoadFailed'));
            captureUnexpectedException(boldError, {
              tags: { flow: 'checkout.bold.open', intent_id: intentId },
            });
          }

          return;
        }

        if (requiresProof && selectedProofFile) {
          try {
            await withSentrySpan('checkout.proofUpload', 'ui.action', { intent_id: intentId }, () =>
              uploadProof(intentId, selectedProofFile),
            );
          } catch (uploadError) {
            toast.error(t('payments:proofUploadFailed'));
            captureUnexpectedException(uploadError, {
              tags: { flow: 'checkout.proofUpload', intent_id: intentId },
            });
          }
        }

        onSubmit(intentId);
      } finally {
        setIsCreatingLinked(false);
      }

      return;
    }

    if (!plan || !checkoutData) {
      return;
    }

    const {
      start_date,
      discount_code,
      is_gift,
      gift_recipient_name,
      gift_recipient_email,
      gift_message,
      gift_is_anonymous,
      gift_sender_display_name,
    } = checkoutData;

    const payload: CreatePaymentIntentPayload = {
      plan_id: plan.id,
      payment_method_type: isWalletMethod ? PaymentMethod.WALLET : paymentMethod,
      discount_code: discount_code.trim() ? discount_code.trim() : undefined,
    };

    if (is_gift) {
      payload.is_gift = true;
      payload.gift_recipient_name = gift_recipient_name.trim();
      payload.gift_recipient_email = gift_recipient_email.trim();
      payload.gift_message = gift_message.trim() ? gift_message.trim() : undefined;
      payload.gift_is_anonymous = gift_is_anonymous;
      payload.gift_sender_display_name = gift_is_anonymous ? undefined : gift_sender_display_name.trim() || undefined;
    } else if (start_date) {
      payload.start_date = start_date.toISOString();
    }

    if (isCardMethod) {
      const { data, ok, error } = await withSentrySpan(
        'checkout.bold',
        'ui.action',
        { plan_id: plan.id, payment_method: paymentMethod },
        () => createBoldCheckout(payload),
      );

      if (!ok) {
        toast.error(t('payments:createFailedDesc'));
        captureUnexpectedException(error ?? new Error('Bold checkout intent create failed'), {
          tags: { flow: 'checkout.bold', plan_id: plan.id },
        });

        return;
      }

      try {
        onClose();
        addSentryBreadcrumb('checkout.bold', 'Opening Bold embedded checkout', { plan_id: plan.id });

        void openBoldEmbeddedCheckout(data.checkout).catch(boldError => {
          toast.error(t('payments:boldLoadFailed'));
          captureUnexpectedException(boldError, {
            tags: { flow: 'checkout.bold.open', plan_id: plan.id },
          });
        });
      } catch (boldError) {
        toast.error(t('payments:boldLoadFailed'));
        captureUnexpectedException(boldError, {
          tags: { flow: 'checkout.bold.open', plan_id: plan.id },
        });
      }

      return;
    }

    const {
      data: intent,
      ok,
      error,
    } = await withSentrySpan(
      'checkout.createIntent',
      'ui.action',
      { plan_id: plan.id, payment_method: payload.payment_method_type },
      () => createIntent(payload),
    );

    if (!ok) {
      toast.error(t('payments:createFailedDesc'));
      captureUnexpectedException(error ?? new Error('Payment intent create failed'), {
        tags: { flow: 'checkout.createIntent', plan_id: plan.id },
      });

      return;
    }

    if (requiresProof && selectedProofFile) {
      try {
        await withSentrySpan('checkout.proofUpload', 'ui.action', { plan_id: plan.id, intent_id: intent.id }, () =>
          uploadProof(intent.id, selectedProofFile),
        );
      } catch (uploadError) {
        toast.error(t('payments:proofUploadFailed'));
        captureUnexpectedException(uploadError, {
          tags: { flow: 'checkout.proofUpload', plan_id: plan.id, intent_id: intent.id },
        });
      }
    }

    onSubmit(intent.id);
  };

  const handleInputFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    const isValidType = Object.values(PaymentProofContentType).includes(file.type as PaymentProofContentType);

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
    <div className='grid grid-rows-[1fr_auto] h-full' data-sentry-mask>
      <section className='grid gap-8 content-start'>
        <section className={cn('grid gap-8', isCardMethod && 'lg:grid-cols-2')}>
          <div className='rounded-md border border-secondary bg-secondary-400/40 py-2 px-4'>
            <label className='block'>{displayTitle}</label>
            <label className='block'>
              {t('payments:total')}: {formatPrice(finalPrice, displayCurrency)}
            </label>
            {walletAmountApplied > 0 ? (
              <>
                <label className='block text-primary'>
                  {t('subscriptions:walletApplied')}: -{formatPrice(walletAmountApplied, displayCurrency)}
                </label>
                <label className='block font-semibold'>
                  {t('subscriptions:amountToCharge')}: {formatPrice(amountToCharge, displayCurrency)}
                </label>
              </>
            ) : null}
            {plan && checkoutData?.is_gift ? (
              <div className='mt-2 grid gap-1 text-sm text-gray-700'>
                <label className='block font-medium text-gray-900'>{t('gifts:checkoutGiftSummaryTitle')}</label>
                <label className='block'>
                  {t('gifts:recipientLabel')}: {checkoutData.gift_recipient_name} ({checkoutData.gift_recipient_email})
                </label>
                {checkoutData.gift_is_anonymous ? (
                  <label className='block'>{t('gifts:anonymousSender')}</label>
                ) : checkoutData.gift_sender_display_name ? (
                  <label className='block'>
                    {t('gifts:fromSender', { name: checkoutData.gift_sender_display_name })}
                  </label>
                ) : null}
                {checkoutData.gift_message ? (
                  <label className='block'>
                    {t('gifts:messageLabel')}: {checkoutData.gift_message}
                  </label>
                ) : null}
                <label className='block text-gray-600'>{t('gifts:startDateGiftNote')}</label>
              </div>
            ) : plan && checkoutData?.start_date ? (
              <label className='block'>
                {t('payments:startDate')}: {format(checkoutData.start_date, 'yyyy-MM-dd')}
              </label>
            ) : null}
          </div>

          {isWalletMethod ? (
            <div className='rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-gray-700'>
              <p className='font-semibold text-primary'>{t('subscriptions:walletFullyCoveredNote')}</p>
            </div>
          ) : null}

          {isCardMethod ? (
            <div className='rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-gray-700'>
              <p className='font-semibold text-primary'>{t(`payments:instructions.${paymentMethod}.title`)}</p>
              <p className='mt-1'>{t(`payments:instructions.${paymentMethod}.description`)}</p>
            </div>
          ) : null}
        </section>

        {requiresProof ? <TransferPaymentInstructions /> : null}

        {requiresProof ? (
          <div
            className='grid lg:grid-cols-2 gap-8 rounded-md border border-dashed border-gray-300 p-3'
            data-sentry-block
          >
            <section>
              <p className='text-sm font-medium text-gray-900'>{t('payments:proofUploadInCheckoutTitle')}</p>
              <p className='text-xs text-gray-600'>{t('payments:proofUploadInCheckoutDesc')}</p>
              <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground'>
                {selectedProofFile ? t('payments:replaceProof') : t('payments:uploadProof')}
                <input
                  type='file'
                  className='hidden'
                  accept={PaymentProofContentTypesList.join(',')}
                  onChange={handleInputFileUpload}
                />
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
                  accept={PaymentProofContentTypesList.join(',')}
                  onChange={handleInputFileUpload}
                />
              </section>
            </section>
          </div>
        ) : null}
      </section>

      <div className='flex justify-end gap-2 pt-4'>
        <Button type='button' className='flex items-center' color='primary' variant='outlined' onClick={onBack}>
          <LuArrowLeft />
          {t('common:back')}
        </Button>

        <Button
          type='submit'
          color='primary'
          isLoading={isBusy}
          disabled={requiresProof && !selectedProofFile}
          onClick={() => onConfirm()}
          className='flex items-center'
        >
          {isBusy
            ? t('subscriptions:processing')
            : isWalletMethod
              ? t('subscriptions:confirmWalletPurchase')
              : t('payments:confirmPurchase')}
          <MdOutlinePayments />
        </Button>
      </div>
    </div>
  );
}
