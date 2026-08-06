import { zodResolver } from '@hookform/resolvers/zod';
import { addMonths } from 'date-fns';
import { TFunction } from 'i18next';
import { Button, Checkbox } from 'polpo/components';
import { useDebounce } from 'polpo/hooks';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { LuArrowRight, LuX } from 'react-icons/lu';
import { z } from 'zod';

import { DateField, EmailField, TextField } from '@components/form-fields';
import { Spinner } from '@components/loaders';
import { DansshipAPI, DansshipAPIError, PaymentPreviewRequest, PublicPlan } from '@core/api';
import { captureUnexpectedException, withSentrySpan } from '@core/sentry';
import { formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

const createCheckoutReviewSchema = (t: TFunction) =>
  z
    .object({
      start_date: z.date().optional(),
      discount_code: z.string(),
      is_gift: z.boolean(),
      gift_recipient_name: z.string(),
      gift_recipient_email: z.string(),
      gift_message: z.string(),
      gift_is_anonymous: z.boolean(),
      gift_sender_display_name: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.is_gift) {
        if (!data.gift_recipient_email.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation:required'),
            path: ['gift_recipient_email'],
          });
        } else if (!z.string().email().safeParse(data.gift_recipient_email.trim()).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation:email'),
            path: ['gift_recipient_email'],
          });
        }

        return;
      }

      if (!data.start_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation:required'),
          path: ['start_date'],
        });
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (data.start_date < today) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('subscriptions:dateInPast'),
            path: ['start_date'],
          });
        }
      }
    });

export type CheckoutFormValues = z.infer<ReturnType<typeof createCheckoutReviewSchema>>;

export interface PaymentData {
  discountCode: string;
  discountBenefitCode: string | null;
  taxContext: string;
  discountContext: string;
  error: string;
  isValid: boolean;
  discountValue: number;
  finalPrice: number;
  applied: boolean;
  baseAmount: number;
  originalPrice: number;
  taxAmount: number;
  bonusClassesGranted: number | null;
  bonusExpiresDays: number | null;
  bonusBenefitName: string | null;
  walletAmountApplied: number;
  amountToCharge: number;
}

export const DefaultPaymentData: PaymentData = {
  taxContext: '',
  discountContext: '',
  discountCode: '',
  discountBenefitCode: null,
  error: '',
  isValid: false,
  discountValue: 0,
  finalPrice: 0,
  baseAmount: 0,
  originalPrice: 0,
  taxAmount: 0,
  applied: false,
  bonusClassesGranted: null,
  bonusExpiresDays: null,
  bonusBenefitName: null,
  walletAmountApplied: 0,
  amountToCharge: 0,
};

export const defaultCheckoutFormValues: CheckoutFormValues = {
  start_date: new Date(),
  discount_code: '',
  is_gift: false,
  gift_recipient_name: '',
  gift_recipient_email: '',
  gift_message: '',
  gift_is_anonymous: false,
  gift_sender_display_name: '',
};

interface CheckoutReviewPlanFormInputProps {
  plan: PublicPlan;
  onCancel: () => void;
  onSubmit: (data: CheckoutFormValues, paymentData: PaymentData) => Promise<void>;
  defaultFormValues: CheckoutFormValues;
}

export const CheckoutReviewPlanFormInput = ({
  plan,
  onCancel,
  onSubmit,
  defaultFormValues,
}: CheckoutReviewPlanFormInputProps) => {
  const { t } = useTranslation();
  const [termsAndConditions, setTermsAndConditions] = useState(false);
  const [giftEligibilityError, setGiftEligibilityError] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    ...DefaultPaymentData,
    finalPrice: plan.price,
    amountToCharge: plan.price,
  });
  const { call: previewPayment, isLoading } = useCallablePromise((payload: PaymentPreviewRequest) =>
    DansshipAPI.payments.previewPayment(payload),
  );

  const { handleSubmit, watch, control, setValue } = useForm<CheckoutFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createCheckoutReviewSchema(t)),
    defaultValues: defaultFormValues,
  });

  const discountCode = useDebounce(watch('discount_code'), 800);
  const isGift = watch('is_gift');
  const giftRecipientEmail = useDebounce(watch('gift_recipient_email'), 800);

  const handleGiftToggle = useCallback(() => {
    const nextIsGift = !isGift;
    setValue('is_gift', nextIsGift);
    setGiftEligibilityError(null);

    if (nextIsGift) {
      setValue('start_date', undefined);

      return;
    }

    setValue('start_date', new Date());
    setValue('gift_recipient_name', '');
    setValue('gift_recipient_email', '');
    setValue('gift_message', '');
    setValue('gift_is_anonymous', false);
    setValue('gift_sender_display_name', '');
  }, [isGift, setValue]);

  const getPaymentPreview = useCallback(async () => {
    void withSentrySpan('checkout.preview', 'ui.action', { plan_id: plan.id }, async () => {
      const previewPayload: PaymentPreviewRequest = {
        plan_id: plan.id,
        discount_code: discountCode ? discountCode.toUpperCase() : undefined,
      };
      const trimmedGiftEmail = giftRecipientEmail.trim();

      if (isGift && trimmedGiftEmail) {
        previewPayload.is_gift = true;
        previewPayload.gift_recipient_email = trimmedGiftEmail;
      }

      const { data, ok, error } = await previewPayment(previewPayload);

      if (!ok) {
        if (isGift && trimmedGiftEmail) {
          const message =
            error instanceof DansshipAPIError
              ? error.body.message || t('gifts:giftEligibilityFailed')
              : t('gifts:giftEligibilityFailed');
          setGiftEligibilityError(message);
        } else {
          setGiftEligibilityError(null);
        }

        captureUnexpectedException(error ?? new Error('Payment preview failed'), {
          tags: { flow: 'checkout.preview', plan_id: plan.id },
        });

        return;
      }

      setGiftEligibilityError(null);

      const {
        base_amount,
        discount_applied,
        discount_type,
        discount_value,
        final_price,
        is_valid,
        original_price,
        rejection_reason,
        tax_amount,
        tax_rate_percentage,
        bonus_classes_granted,
        bonus_expires_days,
        bonus_benefit_name,
        discount_benefit_code,
        wallet_amount_applied,
        amount_to_charge,
      } = data;

      const isPercentage = discount_type === 'percentage_discount' || discount_type === 'percentage';
      const isFixed = discount_type === 'fixed_discount' || discount_type === 'fixed_amount';

      setPaymentData({
        isValid: is_valid,
        discountCode: discountCode.toUpperCase(),
        discountBenefitCode: discount_benefit_code,
        error: rejection_reason || '',
        applied: discount_applied,
        discountValue: discount_value,
        finalPrice: final_price,
        baseAmount: base_amount,
        originalPrice: original_price,
        taxAmount: tax_amount,
        taxContext: `${tax_rate_percentage}%`,
        discountContext: isPercentage
          ? `${discount_value}%`
          : isFixed
            ? formatPrice(discount_value, plan.currency)
            : '',
        bonusClassesGranted: bonus_classes_granted,
        bonusExpiresDays: bonus_expires_days,
        bonusBenefitName: bonus_benefit_name,
        walletAmountApplied: wallet_amount_applied,
        amountToCharge: amount_to_charge,
      });
    });
  }, [discountCode, giftRecipientEmail, isGift, plan.currency, plan.id, previewPayment, t]);

  useEffect(() => {
    void getPaymentPreview();
  }, [getPaymentPreview]);

  const handleInternalSubmit = useCallback(
    async (formData: CheckoutFormValues) => {
      const nextData: CheckoutFormValues = formData.is_gift
        ? {
            ...formData,
            start_date: undefined,
            gift_recipient_email: formData.gift_recipient_email.trim(),
          }
        : {
            ...formData,
            gift_recipient_name: '',
            gift_recipient_email: '',
            gift_message: '',
            gift_is_anonymous: false,
            gift_sender_display_name: '',
          };

      await onSubmit(nextData, paymentData);
    },
    [paymentData, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit(handleInternalSubmit)} className='grid grid-rows-[1fr_auto] h-full'>
      <div className='grid gap-8 content-start'>
        <div className='grid gap-2'>
          <Checkbox label={t('gifts:purchaseAsGift')} name='is_gift' value={isGift} setValue={handleGiftToggle} />
        </div>

        {isGift ? (
          <EmailField
            control={control}
            name='gift_recipient_email'
            label={t('gifts:recipientEmail')}
            placeholder={t('common:placeholder.email')}
            errorMessage={giftEligibilityError ?? undefined}
          />
        ) : (
          <DateField
            control={control}
            name='start_date'
            min={new Date()}
            max={addMonths(new Date(), 1)}
            label={t('subscriptions:startDate')}
          />
        )}

        <TextField
          inputClassName='uppercase'
          control={control}
          name='discount_code'
          disabled={isLoading}
          rightElement={isLoading ? <Spinner /> : undefined}
          placeholder={t('subscriptions:discountCodePlaceholder')}
          label={t('subscriptions:discountCodeLabel')}
          helperText={paymentData.isValid ? t('subscriptions:codeValidationNote') : undefined}
          errorMessage={
            !isLoading && !paymentData.isValid && paymentData.discountCode
              ? t('subscriptions:invalidDiscountCode')
              : undefined
          }
        />
      </div>

      <section className='grid gap-2'>
        <div>
          <div className='mb-2 flex items-center justify-between gap-2'>
            <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:subtotal')}</span>
            <span className='shrink-0'>{formatPrice(paymentData.baseAmount, plan.currency)}</span>
          </div>
          <div className='mb-2 flex items-center justify-between gap-2'>
            <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:iva')}</span>
            <span className='shrink-0'>{formatPrice(paymentData.taxAmount, plan.currency)}</span>
          </div>
          {paymentData.applied && (
            <div className='mb-2 flex items-center justify-between gap-2'>
              <span className='min-w-0 break-words text-gray-500'>
                {paymentData.discountBenefitCode === 'FIRST_PLAN_PCT_10'
                  ? t('subscriptions:discountFirstPlan')
                  : paymentData.discountCode
                    ? t('subscriptions:discountCode')
                    : t('subscriptions:discount')}
              </span>
              <span className='shrink-0'>{isLoading ? <Spinner /> : paymentData.discountContext}</span>
            </div>
          )}

          {paymentData.bonusClassesGranted !== null && paymentData.bonusClassesGranted > 0 && (
            <div className='mb-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary'>
              {t('subscriptions:bonusClassesCheckoutNote', {
                count: paymentData.bonusClassesGranted,
                days: paymentData.bonusExpiresDays ?? 14,
              })}
            </div>
          )}

          <div className='mt-4 flex items-center justify-between gap-2 border-t pt-4 text-lg font-bold'>
            <span className='min-w-0 break-words'>{t('subscriptions:totalDue')}</span>
            <span className='shrink-0'>{formatPrice(paymentData.finalPrice, plan.currency)}</span>
          </div>

          {paymentData.walletAmountApplied > 0 && (
            <>
              <div className='mt-2 flex items-center justify-between gap-2 text-sm'>
                <span className='min-w-0 break-words text-primary'>{t('subscriptions:walletApplied')}</span>
                <span className='shrink-0 text-primary'>
                  -{formatPrice(paymentData.walletAmountApplied, plan.currency)}
                </span>
              </div>
              <div className='flex items-center justify-between gap-2 text-base font-semibold'>
                <span className='min-w-0 break-words'>{t('subscriptions:amountToCharge')}</span>
                <span className='shrink-0'>{formatPrice(paymentData.amountToCharge, plan.currency)}</span>
              </div>
            </>
          )}
        </div>

        <section className='w-full max-w-90 justify-self-end text-label'>
          <Checkbox
            label={
              <Trans
                i18nKey='subscriptions:terms'
                components={{
                  LinkTerms: (
                    <a
                      target='_blank'
                      href='/assets/legal/terminos-y-condiciones-para-compras.pdf'
                      className='text-info underline'
                    />
                  ),
                }}
              />
            }
            name='terms_and_conditions'
            value={termsAndConditions}
            setValue={() => setTermsAndConditions(p => !p)}
          />
        </section>

        <div className='flex flex-wrap justify-end gap-2 pt-4'>
          <Button type='button' className='flex items-center' variant='outlined' color='primary' onClick={onCancel}>
            <LuX />
            {t('common:cancel')}
          </Button>

          <Button
            isLoading={isLoading}
            disabled={
              (Boolean(discountCode) && !paymentData.isValid) || !termsAndConditions || Boolean(giftEligibilityError)
            }
            color='primary'
            className='flex items-center'
          >
            {t('common:next')}
            <LuArrowRight />
          </Button>
        </div>
      </section>
    </form>
  );
};
