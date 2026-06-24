import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { PaymentMethodSelector } from './payment-method-selector';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label } from '@components/ui';
import { type PublicPlan, type PaymentMethodType, DansshipAPI, PaymentProofContentType } from '@core/api';
import { formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

const checkoutSchema = z.object({
  discount_code: z.string().optional(),
  start_date: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PublicPlan | null;
}

export function CheckoutModal({ isOpen, onClose, selectedPlan }: CheckoutModalProps) {
  const { t } = useTranslation();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('transfer');
  const [createdIntentId, setCreatedIntentId] = useState<string | null>(null);
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);

  const { register, handleSubmit, watch, reset } = useForm<CheckoutFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      discount_code: '',
      start_date: todayStr,
    },
  });

  const [previewFinalPrice, setPreviewFinalPrice] = useState<number | null>(null);
  const [previewIsValid, setPreviewIsValid] = useState<boolean | null>(null);
  const [previewDiscountApplied, setPreviewDiscountApplied] = useState(false);
  const [previewDiscountType, setPreviewDiscountType] = useState<'percentage' | 'fixed_amount' | null>(null);
  const [previewDiscountValue, setPreviewDiscountValue] = useState<number | null>(null);
  const [previewRejectionReason, setPreviewRejectionReason] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const previewRequestRef = useRef(0);

  const discountCode = watch('discount_code') ?? '';
  const startDate = watch('start_date');

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setPaymentMethod('transfer');
      setCreatedIntentId(null);
      setSelectedProofFile(null);
      reset({ discount_code: '', start_date: todayStr });
      setPreviewFinalPrice(null);
      setPreviewIsValid(null);
      setPreviewDiscountApplied(false);
      setPreviewDiscountType(null);
      setPreviewDiscountValue(null);
      setPreviewRejectionReason(null);
      setIsPreviewLoading(false);

      return;
    }
  }, [isOpen, reset, todayStr]);

  useEffect(() => {
    if (!isOpen || !selectedPlan) {
      setPreviewFinalPrice(null);
      setPreviewIsValid(null);
      setPreviewDiscountApplied(false);
      setPreviewDiscountType(null);
      setPreviewDiscountValue(null);
      setPreviewRejectionReason(null);
      setIsPreviewLoading(false);

      return;
    }

    const trimmedCode = discountCode.trim();

    if (!trimmedCode) {
      setPreviewFinalPrice(null);
      setPreviewIsValid(null);
      setPreviewDiscountApplied(false);
      setPreviewDiscountType(null);
      setPreviewDiscountValue(null);
      setPreviewRejectionReason(null);
      setIsPreviewLoading(false);

      return;
    }

    const currentRequestId = ++previewRequestRef.current;
    const timeout = window.setTimeout(async () => {
      setIsPreviewLoading(true);
      try {
        const { data } = await DansshipAPI.subscriptions.previewDiscount({
          plan_id: selectedPlan.id,
          discount_code: trimmedCode,
        });

        if (!data || previewRequestRef.current !== currentRequestId) {
          return;
        }

        setPreviewIsValid(data.is_valid !== false);
        setPreviewRejectionReason(data.rejection_reason ?? null);

        if (data.is_valid === false || data.final_price === undefined) {
          setPreviewFinalPrice(null);
          setPreviewDiscountApplied(false);
          setPreviewDiscountType(null);
          setPreviewDiscountValue(null);

          return;
        }

        setPreviewFinalPrice(Number(data.final_price));
        setPreviewDiscountApplied(data.discount_applied === true);
        setPreviewDiscountType(data.discount_type ?? null);
        setPreviewDiscountValue(
          data.discount_value !== undefined && data.discount_value !== null ? Number(data.discount_value) : null,
        );
      } catch {
        if (previewRequestRef.current !== currentRequestId) {
          return;
        }

        setPreviewFinalPrice(null);
        setPreviewIsValid(null);
        setPreviewDiscountApplied(false);
        setPreviewDiscountType(null);
        setPreviewDiscountValue(null);
        setPreviewRejectionReason(null);
      } finally {
        if (previewRequestRef.current === currentRequestId) {
          setIsPreviewLoading(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      setIsPreviewLoading(false);
    };
  }, [discountCode, isOpen, selectedPlan]);

  const apiEnabled = isOpen && Boolean(selectedPlan);
  const proofUploadUrl = useCallablePromise(((...args) =>
    DansshipAPI.payments.getProofUploadUrl(...args)) as typeof DansshipAPI.payments.getProofUploadUrl);
  const confirmationProofUpload = useCallablePromise(((...args) =>
    DansshipAPI.payments.confirmProofUpload(...args)) as typeof DansshipAPI.payments.confirmProofUpload);
  const creationIntent = useCallablePromise(((...args) =>
    DansshipAPI.payments.createIntent(...args)) as typeof DansshipAPI.payments.createIntent);

  const subtotal = selectedPlan ? Number(selectedPlan.price) : 0;
  const finalPrice = previewFinalPrice ?? subtotal;
  const discountAmount = Math.max(0, subtotal - finalPrice);
  const requiresProof = paymentMethod === 'transfer' || paymentMethod === 'nequi' || paymentMethod === 'daviplata';
  const fileAccept = `${PaymentProofContentType.JPEG},${PaymentProofContentType.PNG},${PaymentProofContentType.WEBP}`;
  const isUploadingProof = proofUploadUrl.isLoading || confirmationProofUpload.isLoading;

  const canProceed = useMemo(() => {
    if (!selectedPlan) return false;

    if (isPreviewLoading) return false;

    return previewIsValid !== false;
  }, [selectedPlan, isPreviewLoading, previewIsValid]);

  const discountCodeLabel = discountCode.trim().toUpperCase();
  const discountContext =
    previewDiscountType === 'percentage' && previewDiscountValue !== null
      ? `${previewDiscountValue}%`
      : previewDiscountType === 'fixed_amount' && previewDiscountValue !== null && selectedPlan
        ? formatPrice(previewDiscountValue, selectedPlan.currency)
        : null;

  const onConfirm = async (data: CheckoutFormValues) => {
    if (!selectedPlan) return;

    if (requiresProof && !selectedProofFile) {
      toast.error(t('payments:proofRequiredTitle'));

      return;
    }

    const parsedStartDate =
      data.start_date && data.start_date !== todayStr ? new Date(data.start_date).toISOString() : undefined;

    if (apiEnabled) {
      const { data: intent } = await creationIntent.call({
        plan_id: selectedPlan.id,
        payment_method_type: paymentMethod,
        discount_code: data.discount_code?.trim() ? data.discount_code.trim() : undefined,
        start_date: parsedStartDate,
      });

      if (intent?.id) {
        if (requiresProof && selectedProofFile) {
          try {
            const { data } = await proofUploadUrl.call(intent.id, {
              content_type: selectedProofFile.type as PaymentProofContentType,
            });

            if (data) {
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

              await confirmationProofUpload.call(intent.id, { file_key: data.file_key });
            }
          } catch {
            toast.error(t('payments:proofUploadFailed'));
          }
        }

        setCreatedIntentId(intent.id);
        setStep(4);
      }
    }
  };

  const renderStep = () => {
    if (!selectedPlan) return null;

    if (step === 1) {
      return (
        <div className='space-y-4'>
          <div className='rounded-md border border-secondary/50 bg-accent p-4'>
            <h3 className='font-semibold text-primary'>{selectedPlan.name}</h3>
            <p className='mt-1 text-sm text-primary/80'>
              {t('subscriptions:planSummary', {
                classes: selectedPlan.classes_included,
                days: selectedPlan.validity_days,
              })}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='start_date'>{t('subscriptions:startDate')}</Label>
            <Input id='start_date' type='date' min={todayStr} {...register('start_date')} />
            <p className='text-sm text-gray-500'>{t('subscriptions:startDateHelp')}</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='discount_code'>{t('subscriptions:discountCodeLabel')}</Label>
            <Input
              id='discount_code'
              placeholder={t('subscriptions:enterCode')}
              className='uppercase'
              {...register('discount_code')}
            />
            <p className='text-sm text-gray-500'>{t('subscriptions:codeValidationNote')}</p>
            {discountCode.trim().length > 0 && !isPreviewLoading && previewIsValid === false ? (
              <p className='text-xs text-gray-500'>
                {previewRejectionReason ?? t('subscriptions:invalidDiscountCode')}
              </p>
            ) : null}
          </div>

          <div className='border-t pt-4'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-gray-500'>{t('subscriptions:subtotal')}</span>
              <span>{formatPrice(subtotal, selectedPlan.currency)}</span>
            </div>

            {previewDiscountApplied && discountAmount > 0 ? (
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-gray-500'>
                  {t('subscriptions:discount')}
                  {discountCodeLabel ? ` (${discountCodeLabel}` : ''}
                  {discountContext ? `${discountCodeLabel ? ' · ' : ' ('}${discountContext}` : ''}
                  {discountCodeLabel || discountContext ? ')' : ''}
                </span>
                <span className='text-green-700'>- {formatPrice(discountAmount, selectedPlan.currency)}</span>
              </div>
            ) : null}

            <div className='mt-4 flex items-center justify-between border-t pt-4 text-lg font-bold'>
              <span>{t('subscriptions:totalDue')}</span>
              <span>{formatPrice(finalPrice, selectedPlan.currency)}</span>
            </div>
            {isPreviewLoading ? <p className='mt-2 text-xs text-gray-500'>{t('common:loading')}</p> : null}
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className='space-y-4'>
          <h3 className='text-base font-semibold text-gray-900'>{t('payments:selectMethod')}</h3>
          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
            availableMethods={['transfer', 'cash', 'nequi', 'daviplata']}
          />
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className='space-y-4'>
          <h3 className='text-base font-semibold text-gray-900'>{t('payments:confirmationTitle')}</h3>

          <div className='rounded-md border border-gray-200 bg-gray-50 p-4 text-sm'>
            <p className='font-medium text-gray-900'>{selectedPlan.name}</p>
            <p className='mt-1 text-gray-600'>
              {t('payments:selectedMethod')}: {t(`payments:method.${paymentMethod}`)}
            </p>
            <p className='text-gray-600'>
              {t('payments:total')}: {formatPrice(finalPrice, selectedPlan.currency)}
            </p>
            {startDate ? (
              <p className='text-gray-600'>
                {t('payments:startDate')}: {startDate}
              </p>
            ) : null}
          </div>

          <div className='rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-gray-700'>
            <p className='font-semibold text-primary'>{t(`payments:instructions.${paymentMethod}.title`)}</p>
            <p className='mt-1'>{t(`payments:instructions.${paymentMethod}.description`)}</p>
          </div>

          {requiresProof ? (
            <div className='space-y-2 rounded-md border border-dashed border-gray-300 p-3'>
              <p className='text-sm font-medium text-gray-900'>{t('payments:proofUploadInCheckoutTitle')}</p>
              <p className='text-xs text-gray-600'>{t('payments:proofUploadInCheckoutDesc')}</p>
              <label className='inline-flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground'>
                {selectedProofFile ? t('payments:replaceProof') : t('payments:uploadProof')}
                <input
                  type='file'
                  className='hidden'
                  accept={fileAccept}
                  onChange={event => {
                    const file = event.target.files?.[0] ?? null;

                    if (!file) return;

                    const isValidType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);

                    if (!isValidType) {
                      toast.error(t('payments:proofInvalidTypeTitle'));
                      event.currentTarget.value = '';

                      return;
                    }

                    setSelectedProofFile(file);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {selectedProofFile ? (
                <p className='text-xs text-gray-600'>{selectedProofFile.name}</p>
              ) : (
                <p className='text-xs text-red-600'>{t('payments:proofRequiredInline')}</p>
              )}
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className='space-y-3 text-center'>
        <h3 className='text-lg font-semibold text-gray-900'>{t('payments:intentCreatedTitle')}</h3>
        <p className='text-sm text-gray-600'>{t('payments:intentCreatedDesc')}</p>
        {createdIntentId ? (
          <p className='text-xs text-gray-500'>
            {t('payments:reference')}: {createdIntentId}
          </p>
        ) : null}
      </div>
    );
  };

  const showBack = step > 1 && step < 4;
  const showNext = step < 3;
  const showConfirm = step === 3;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='max-w-xl' onInteractOutside={event => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t('payments:checkoutTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onConfirm)} className='space-y-6'>
          <div className='flex items-center gap-2 text-xs text-gray-500'>
            <span className={step >= 1 ? 'font-semibold text-primary' : ''}>1. {t('payments:steps.review')}</span>
            <span>•</span>
            <span className={step >= 2 ? 'font-semibold text-primary' : ''}>2. {t('payments:steps.method')}</span>
            <span>•</span>
            <span className={step >= 3 ? 'font-semibold text-primary' : ''}>3. {t('payments:steps.confirm')}</span>
          </div>

          {renderStep()}

          <div className='flex justify-end gap-2 border-t pt-4'>
            {step === 4 ? (
              <Button type='button' onClick={onClose}>
                {t('common:close')}
              </Button>
            ) : (
              <>
                {showBack ? (
                  <Button type='button' variant='outline' onClick={() => setStep(prev => Math.max(1, prev - 1))}>
                    {t('common:back')}
                  </Button>
                ) : (
                  <Button type='button' variant='outline' onClick={onClose}>
                    {t('common:cancel')}
                  </Button>
                )}

                {showNext ? (
                  <Button
                    type='button'
                    disabled={step === 1 && !canProceed}
                    onClick={() => setStep(prev => Math.min(3, prev + 1))}
                  >
                    {t('common:next')}
                  </Button>
                ) : null}

                {showConfirm ? (
                  <Button
                    type='submit'
                    disabled={creationIntent.isLoading || isUploadingProof || (requiresProof && !selectedProofFile)}
                  >
                    {creationIntent.isLoading || isUploadingProof
                      ? t('subscriptions:processing')
                      : t('payments:confirmPurchase')}
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
