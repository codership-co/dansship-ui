import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { ChangeEvent, DragEvent, ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuRefreshCw, LuUpload } from 'react-icons/lu';
import { MdOutlinePayments } from 'react-icons/md';
import { toast } from 'sonner';

import { CheckoutFormValues } from '@components/forms/checkout-review-plan-form';
import { TransferPaymentInstructions } from '@components/modules/payments/transfer-payment-instructions';
import { Badge } from '@components/ui';
import {
  type CreatePaymentIntentPayload,
  DansshipAPI,
  openBoldEmbeddedCheckout,
  PaymentMethod,
  PaymentProofContentTypesList,
  PublicPlan,
} from '@core/api';
import { addSentryBreadcrumb, captureUnexpectedException, withSentrySpan } from '@core/sentry';
import { cn, formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

const PDF_CONTENT_TYPE = 'application/pdf';

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: PDF_CONTENT_TYPE,
};

/** Some systems report no type for a file the extension makes obvious; trust the extension then. */
function resolveContentType(file: File) {
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  return CONTENT_TYPE_BY_EXTENSION[file.name.split('.').pop()?.toLowerCase() ?? ''] ?? file.type;
}

interface CheckoutPaymentProofFormProps {
  plan?: PublicPlan;
  paymentMethod: PaymentMethod;
  finalPrice: number;
  amountToCharge: number;
  walletAmountApplied: number;
  originalPrice?: number;
  onClose: () => void;
  /** Hides the back button when the form is not a step of a longer flow. */
  onBack?: () => void;
  checkoutData?: CheckoutFormValues;
  onSubmit: (intentId: string) => void;
  summaryTitle?: string;
  hideSummary?: boolean;
  currency?: string;
  onCreateIntent?: () => Promise<string | null>;
  /** Replaces the student proof upload, e.g. the admin endpoint when paying on someone's behalf. */
  uploadProofForIntent?: (intentId: string, file: File) => Promise<unknown>;
  /** Replaces the whole intent + proof flow: the caller registers the payment from the chosen proof. */
  onConfirmWithProof?: (file: File) => Promise<unknown>;
  paymentQrUrl?: string | null;
  /** Admins also attach the PDF receipts people share; the student checkout stays images only. */
  allowPdfProof?: boolean;
  variant?: 'default' | 'event';
  confirmLabel?: string;
  canConfirm?: boolean;
  topSlot?: ReactNode;
  acceptance?: ReactNode;
  bodyClassName?: string;
  footerClassName?: string;
}

export function CheckoutPaymentProofForm({
  plan,
  paymentMethod,
  finalPrice,
  amountToCharge,
  walletAmountApplied,
  originalPrice,
  onClose,
  onBack,
  checkoutData,
  onSubmit,
  summaryTitle,
  hideSummary = false,
  currency,
  onCreateIntent,
  uploadProofForIntent,
  onConfirmWithProof,
  paymentQrUrl,
  allowPdfProof = false,
  variant = 'default',
  confirmLabel,
  canConfirm = true,
  topSlot,
  acceptance,
  bodyClassName,
  footerClassName,
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
  const [proofError, setProofError] = useState<string | null>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const displayTitle = summaryTitle ?? plan?.name ?? '';
  const displayCurrency = currency ?? plan?.currency ?? 'COP';
  const isQuarterlyCheckout = Boolean(checkoutData?.is_quarterly) && checkoutData?.purchase_mode !== 'duo';
  const quarterlyClassCount = (plan?.classes_included ?? 0) * 3;
  const showOriginalPrice = originalPrice !== undefined && originalPrice > finalPrice;

  const proofContentTypes: Array<string> = allowPdfProof
    ? [...PaymentProofContentTypesList, PDF_CONTENT_TYPE]
    : PaymentProofContentTypesList;

  const onConfirm = async () => {
    if (requiresProof && !selectedProofFile) {
      toast.error(t('payments:proofRequiredTitle'));

      return;
    }

    if (onConfirmWithProof) {
      if (!selectedProofFile) {
        return;
      }

      setIsCreatingLinked(true);

      try {
        await onConfirmWithProof(selectedProofFile);
      } finally {
        setIsCreatingLinked(false);
      }

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
              (uploadProofForIntent ?? uploadProof)(intentId, selectedProofFile),
            );
          } catch (uploadError) {
            toast.error(t('payments:proofUploadFailedCheckout'));
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
      referral_code,
      is_gift,
      gift_recipient_name,
      gift_recipient_email,
      gift_message,
      gift_is_anonymous,
      gift_sender_display_name,
      purchase_mode,
      duo_partner_email,
      is_quarterly,
    } = checkoutData;

    const isDuoCheckout = purchase_mode === 'duo';
    const payload: CreatePaymentIntentPayload = {
      plan_id: plan.id,
      payment_method_type: isWalletMethod ? PaymentMethod.WALLET : paymentMethod,
    };

    if (isDuoCheckout) {
      payload.is_duo = true;
      payload.duo_partner_email = duo_partner_email.trim();

      if (start_date) {
        payload.start_date = start_date.toISOString();
      }
    } else {
      payload.discount_code = discount_code.trim() ? discount_code.trim() : undefined;
      payload.referral_code = !is_gift && referral_code?.trim() ? referral_code.trim() : undefined;
      payload.is_quarterly = Boolean(is_quarterly);

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
        toast.error(t('payments:proofUploadFailedCheckout'));
        captureUnexpectedException(uploadError, {
          tags: { flow: 'checkout.proofUpload', plan_id: plan.id, intent_id: intent.id },
        });
      }
    }

    onSubmit(intent.id);
  };

  const acceptProofFile = (file: File) => {
    const contentType = resolveContentType(file);

    if (!proofContentTypes.includes(contentType)) {
      setProofError(file.name);
      toast.error(t('payments:proofInvalidTypeTitle'));

      return;
    }

    setProofError(null);
    setImageUrl(contentType.startsWith('image/') ? URL.createObjectURL(file) : null);
    setSelectedProofFile(file.type === contentType ? file : new File([file], file.name, { type: contentType }));
  };

  const handleInputFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;

    if (file) {
      acceptProofFile(file);
    }

    // Lets the same file be chosen again after replacing it.
    input.value = '';
  };

  const openProofPicker = () => proofInputRef.current?.click();

  const handleProofDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];

    if (file) {
      acceptProofFile(file);
    }
  };

  if (variant === 'event') {
    const proofLabel = selectedProofFile ? t('payments:replaceProof') : t('payments:uploadProof');

    return (
      <>
        <section className={cn('grid content-start gap-4', bodyClassName)} data-sentry-mask>
          {topSlot}
          <div className={cn('grid items-start gap-4', requiresProof && 'lg:grid-cols-2')}>
            {requiresProof ? <TransferPaymentInstructions variant='event' qrUrl={paymentQrUrl} /> : null}
            <div className='grid content-start gap-5'>
              {requiresProof ? (
                <section className='grid gap-2' data-sentry-block>
                  <p className='m-0 text-[15px] font-semibold'>{t('eventos:checkout.yourProof')}</p>
                  <div
                    role='button'
                    tabIndex={0}
                    aria-label={proofLabel}
                    onClick={openProofPicker}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openProofPicker();
                      }
                    }}
                    onDragOver={event => event.preventDefault()}
                    onDrop={handleProofDrop}
                    className={cn(
                      'relative flex min-h-17 cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-2',
                      selectedProofFile
                        ? 'border-border bg-white'
                        : 'border-dashed border-muted-foreground bg-background',
                    )}
                  >
                    {selectedProofFile && imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={t('payments:proofPreviewAlt')}
                        className='size-13 shrink-0 rounded-lg border border-border object-cover'
                      />
                    ) : (
                      <span className='grid size-10 shrink-0 place-content-center rounded-full bg-secondary text-primary'>
                        <LuUpload className='size-5' aria-hidden />
                      </span>
                    )}
                    <span className='grid min-w-0 flex-1 justify-items-start gap-0.5'>
                      {selectedProofFile ? (
                        <>
                          <span className='w-full truncate font-semibold'>{selectedProofFile.name}</span>
                          <Badge variant='outlineActive' size='small'>
                            {t('eventos:checkout.proofLoaded')}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <span className='font-semibold'>{t('eventos:checkout.pickImage')}</span>
                          <span className='text-sm text-muted-foreground'>
                            {t(
                              allowPdfProof ? 'eventos:checkout.proofFormatsWithPdf' : 'eventos:checkout.proofFormats',
                            )}
                          </span>
                        </>
                      )}
                    </span>
                    {selectedProofFile ? (
                      <Button
                        type='button'
                        color='primary'
                        variant='outlined'
                        size='small'
                        className='size-10 shrink-0 px-0'
                        aria-label={t('eventos:checkout.replace')}
                        title={t('eventos:checkout.replace')}
                        onClick={event => {
                          event.stopPropagation();
                          openProofPicker();
                        }}
                      >
                        <LuRefreshCw className='size-4' aria-hidden />
                      </Button>
                    ) : null}
                  </div>
                  <input
                    ref={proofInputRef}
                    type='file'
                    hidden
                    aria-label={proofLabel}
                    accept={proofContentTypes.join(',')}
                    onChange={handleInputFileUpload}
                  />
                  {proofError ? (
                    <p role='alert' className='m-0 text-sm text-alert-600'>
                      {t('eventos:checkout.proofRejected', {
                        name: proofError,
                        formats: t(
                          allowPdfProof ? 'eventos:checkout.proofFormatsWithPdf' : 'eventos:checkout.proofFormats',
                        ),
                      })}
                    </p>
                  ) : null}
                </section>
              ) : null}
              {acceptance}
            </div>
          </div>
        </section>
        <div
          className={cn(
            'sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:justify-end',
            footerClassName,
          )}
        >
          {onBack ? (
            <Button
              type='button'
              color='primary'
              variant='outlined'
              className='flex flex-1 items-center md:flex-none'
              onClick={onBack}
            >
              <LuArrowLeft />
              {t('common:back')}
            </Button>
          ) : null}
          <Button
            type='button'
            color='primary'
            variant='solid'
            isLoading={isBusy}
            disabled={(requiresProof && !selectedProofFile) || !canConfirm}
            onClick={() => onConfirm()}
            className='flex-1 md:flex-none'
          >
            {isBusy ? t('subscriptions:processing') : (confirmLabel ?? t('payments:confirmPurchase'))}
          </Button>
        </div>
      </>
    );
  }

  return (
    <div className='grid grid-rows-[1fr_auto] h-full' data-sentry-mask>
      <section className='grid gap-8 content-start'>
        {!hideSummary || isWalletMethod || isCardMethod ? (
          <section className={cn('grid gap-8', isCardMethod && 'lg:grid-cols-2')}>
            {hideSummary ? null : (
              <div className='rounded-md border border-secondary bg-secondary-400/40 py-2 px-4'>
                <label className='block'>{displayTitle}</label>
                <label className='block'>
                  <span>{t('payments:total')}: </span>
                  <span className='font-semibold'>{formatPrice(finalPrice, displayCurrency)}</span>
                </label>
                {showOriginalPrice ? (
                  <label className='block text-sm font-medium text-destructive line-through decoration-destructive'>
                    {t('subscriptions:priceBefore', { amount: formatPrice(originalPrice, displayCurrency) })}
                  </label>
                ) : null}
                {walletAmountApplied > 0 || amountToCharge !== finalPrice ? (
                  <>
                    {walletAmountApplied > 0 ? (
                      <label className='block text-primary'>
                        {t('subscriptions:walletApplied')}: -{formatPrice(walletAmountApplied, displayCurrency)}
                      </label>
                    ) : null}
                    <label className='block font-semibold'>
                      {t('subscriptions:amountToCharge')}: {formatPrice(amountToCharge, displayCurrency)}
                    </label>
                  </>
                ) : null}
                {plan && checkoutData?.purchase_mode === 'duo' ? (
                  <div className='mt-2 grid gap-1 text-sm text-gray-700'>
                    <label className='block font-medium text-gray-900'>{t('payments:checkoutDuoSummaryTitle')}</label>
                    <label className='block'>
                      {t('payments:checkoutDuoPartner')}: {checkoutData.duo_partner_email}
                    </label>
                    {checkoutData.start_date ? (
                      <label className='block'>
                        {t('payments:checkoutDuoSharedStart', { date: format(checkoutData.start_date, 'yyyy-MM-dd') })}
                      </label>
                    ) : null}
                  </div>
                ) : plan && checkoutData?.is_gift ? (
                  <div className='mt-2 grid gap-1 text-sm text-gray-700'>
                    <label className='block font-medium text-gray-900'>{t('gifts:checkoutGiftSummaryTitle')}</label>
                    <label className='block'>
                      {t('gifts:recipientLabel')}: {checkoutData.gift_recipient_name} (
                      {checkoutData.gift_recipient_email})
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
                {plan && isQuarterlyCheckout ? (
                  <div className='mt-2 grid gap-1 text-sm text-gray-700'>
                    <label className='block font-medium text-gray-900'>
                      {t('subscriptions:quarterlySummaryTitle')}
                    </label>
                    <label className='block'>
                      {t('subscriptions:quarterlyClassesIncluded', { count: quarterlyClassCount })}
                    </label>
                    <label className='block'>{t('subscriptions:quarterlyValidity', { count: 90 })}</label>
                  </div>
                ) : null}
              </div>
            )}

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
        ) : null}

        {requiresProof ? <TransferPaymentInstructions qrUrl={paymentQrUrl} /> : null}

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
          variant='solid'
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
