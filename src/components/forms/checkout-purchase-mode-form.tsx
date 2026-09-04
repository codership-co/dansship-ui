import { zodResolver } from '@hookform/resolvers/zod';
import { addMonths } from 'date-fns';
import { Button } from 'polpo/components';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowRight, LuX } from 'react-icons/lu';

import { DateField, EmailField, TextField } from '@components/form-fields';
import {
  CheckoutFormValues,
  DefaultPaymentData,
  PaymentData,
  createCheckoutReviewSchema,
  defaultCheckoutFormValues,
} from '@components/forms/checkout-review-plan-form';
import { Spinner } from '@components/loaders';
import {
  CheckoutPurchaseMode,
  CheckoutPurchaseModeSelector,
} from '@components/modules/payments/checkout-purchase-mode-selector';
import { Tabs, TabsList, TabsTrigger } from '@components/ui';
import { DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError, PaymentPreviewRequest, PublicPlan } from '@core/api';
import { captureUnexpectedException, withSentrySpan } from '@core/sentry';
import { formatPrice, isColombiaSeptember } from '@helpers';
import { useCallablePromise } from '@hooks';

const referralRejectionKey = (reason: string | null | undefined): string | null => {
  if (reason === 'Referral code not found') {
    return 'subscriptions:invalidReferralCode';
  }

  if (reason === 'Cannot use your own referral code') {
    return 'subscriptions:ownReferralCode';
  }

  if (reason === 'Not first plan purchase') {
    return 'subscriptions:referralNotFirstPurchase';
  }

  return null;
};

const duoPreviewErrorKey = (error: unknown): string | null => {
  if (!(error instanceof DansshipAPIError)) {
    return null;
  }

  switch (error.body.error_code) {
    case DANSSHIP_ERROR_CODE.DUO_SELF_REFERENCE:
      return 'subscriptions:duoSelfReference';
    case DANSSHIP_ERROR_CODE.DUO_NOT_AVAILABLE:
      return 'subscriptions:duoNotAvailable';
    case DANSSHIP_ERROR_CODE.DUO_PLAN_NOT_ELIGIBLE:
      return 'subscriptions:duoPlanNotEligible';
    case DANSSHIP_ERROR_CODE.DUO_INVALID_PARTNER_EMAIL:
      return 'subscriptions:duoInvalidPartnerEmail';
    default:
      return null;
  }
};

const resolvePurchaseMode = (values: CheckoutFormValues): CheckoutPurchaseMode => {
  if (values.purchase_mode) {
    return values.purchase_mode;
  }

  return values.is_gift ? 'gift' : 'self';
};

interface CheckoutPurchaseModeFormProps {
  plan: PublicPlan;
  onCancel: () => void;
  onSubmit: (data: CheckoutFormValues, paymentData: PaymentData) => Promise<void>;
  defaultFormValues: CheckoutFormValues;
}

export function CheckoutPurchaseModeForm({
  plan,
  onCancel,
  onSubmit,
  defaultFormValues,
}: CheckoutPurchaseModeFormProps) {
  const { t } = useTranslation();
  const classesIncluded = plan.classes_included ?? 0;
  const showDuo = classesIncluded > 0 && classesIncluded % 2 === 0 && isColombiaSeptember();
  const initialMode = resolvePurchaseMode(defaultFormValues);
  const [giftEligibilityError, setGiftEligibilityError] = useState<string | null>(null);
  const [duoPartnerError, setDuoPartnerError] = useState<string | null>(null);
  const [codeKind, setCodeKind] = useState<'discount' | 'referral'>(
    defaultFormValues.referral_code.trim() ? 'referral' : 'discount',
  );
  const [paymentData, setPaymentData] = useState<PaymentData>({
    ...DefaultPaymentData,
    isValid: true,
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
    defaultValues: {
      ...defaultCheckoutFormValues,
      ...defaultFormValues,
      purchase_mode: showDuo || initialMode !== 'duo' ? initialMode : 'self',
    },
  });

  const discountCode = watch('discount_code');
  const referralCode = watch('referral_code');
  const purchaseMode = watch('purchase_mode');
  const giftRecipientEmail = watch('gift_recipient_email');
  const duoPartnerEmail = watch('duo_partner_email');
  const isGift = purchaseMode === 'gift';
  const isDuo = purchaseMode === 'duo';
  const duoHalfClasses = Math.floor(classesIncluded / 2);

  const handlePurchaseModeChange = useCallback(
    (nextMode: CheckoutPurchaseMode) => {
      setValue('purchase_mode', nextMode);
      setValue('is_gift', nextMode === 'gift');
      setGiftEligibilityError(null);
      setDuoPartnerError(null);

      if (nextMode === 'gift') {
        setValue('start_date', undefined);
        setValue('duo_partner_email', '');
        setValue('referral_code', '');
        setCodeKind('discount');

        return;
      }

      setValue('start_date', new Date());
      setValue('gift_recipient_name', '');
      setValue('gift_recipient_email', '');
      setValue('gift_message', '');
      setValue('gift_is_anonymous', false);
      setValue('gift_sender_display_name', '');

      if (nextMode === 'duo') {
        setValue('discount_code', '');
        setValue('referral_code', '');
        setCodeKind('discount');

        return;
      }

      setValue('duo_partner_email', '');
    },
    [setValue],
  );

  const handleCodeKindChange = useCallback(
    (nextKind: string) => {
      const kind = nextKind === 'referral' ? 'referral' : 'discount';
      setCodeKind(kind);

      if (kind === 'discount') {
        setValue('referral_code', '');

        return;
      }

      setValue('discount_code', '');
    },
    [setValue],
  );

  useEffect(() => {
    if (!showDuo && purchaseMode === 'duo') {
      handlePurchaseModeChange('self');
    }
  }, [handlePurchaseModeChange, purchaseMode, showDuo]);

  useEffect(() => {
    setGiftEligibilityError(null);
  }, [giftRecipientEmail]);

  useEffect(() => {
    setDuoPartnerError(null);
  }, [duoPartnerEmail]);

  useEffect(() => {
    setPaymentData(current => ({
      ...current,
      isValid: true,
      error: '',
    }));
  }, [discountCode, referralCode]);

  const handleInternalSubmit = useCallback(
    async (formData: CheckoutFormValues) => {
      const mode = formData.purchase_mode;
      const nextData: CheckoutFormValues =
        mode === 'gift'
          ? {
              ...formData,
              is_gift: true,
              start_date: undefined,
              duo_partner_email: '',
              gift_recipient_email: formData.gift_recipient_email.trim(),
            }
          : mode === 'duo'
            ? {
                ...formData,
                is_gift: false,
                discount_code: '',
                referral_code: '',
                gift_recipient_name: '',
                gift_recipient_email: '',
                gift_message: '',
                gift_is_anonymous: false,
                gift_sender_display_name: '',
                duo_partner_email: formData.duo_partner_email.trim(),
              }
            : {
                ...formData,
                is_gift: false,
                duo_partner_email: '',
                gift_recipient_name: '',
                gift_recipient_email: '',
                gift_message: '',
                gift_is_anonymous: false,
                gift_sender_display_name: '',
              };

      const nextPaymentData = await withSentrySpan('checkout.preview', 'ui.action', { plan_id: plan.id }, async () => {
        const previewPayload: PaymentPreviewRequest = { plan_id: plan.id };
        const nextDiscountCode = nextData.discount_code.trim();
        const nextReferralCode = nextData.referral_code.trim();

        if (mode === 'duo') {
          previewPayload.is_duo = true;
          previewPayload.duo_partner_email = nextData.duo_partner_email;
        } else {
          previewPayload.discount_code = nextDiscountCode ? nextDiscountCode.toUpperCase() : undefined;
          previewPayload.referral_code =
            mode !== 'gift' && nextReferralCode ? nextReferralCode.toUpperCase() : undefined;

          if (mode === 'gift') {
            previewPayload.is_gift = true;
            previewPayload.gift_recipient_email = nextData.gift_recipient_email;
          }
        }

        const { data, ok, error } = await previewPayment(previewPayload);

        if (!ok) {
          if (mode === 'gift') {
            setGiftEligibilityError(
              error instanceof DansshipAPIError
                ? error.body.message || t('gifts:giftEligibilityFailed')
                : t('gifts:giftEligibilityFailed'),
            );
          } else {
            setGiftEligibilityError(null);
          }

          if (mode === 'duo') {
            const mapped = duoPreviewErrorKey(error);
            setDuoPartnerError(mapped ? t(mapped) : error instanceof DansshipAPIError ? error.body.message : null);
          } else {
            setDuoPartnerError(null);
          }

          captureUnexpectedException(error ?? new Error('Payment preview failed'), {
            tags: { flow: 'checkout.preview', plan_id: plan.id },
          });

          return null;
        }

        setGiftEligibilityError(null);
        setDuoPartnerError(null);

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

        return {
          isValid: is_valid,
          discountCode: nextDiscountCode.toUpperCase(),
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
        } satisfies PaymentData;
      });

      if (!nextPaymentData) {
        return;
      }

      setPaymentData(nextPaymentData);

      const enteredDiscount = Boolean(nextData.discount_code.trim());
      const enteredReferral = Boolean(nextData.referral_code.trim());

      if (mode !== 'duo' && (enteredDiscount || enteredReferral) && !nextPaymentData.isValid) {
        return;
      }

      await onSubmit(nextData, nextPaymentData);
    },
    [onSubmit, plan.currency, plan.id, previewPayment, t],
  );

  const showMergedCodeTabs = purchaseMode === 'self';
  const showSingleDiscountField = purchaseMode === 'gift';
  const codeFieldDisabled = isLoading;

  const discountErrorMessage =
    !isLoading && !paymentData.isValid && paymentData.discountCode && !referralRejectionKey(paymentData.error)
      ? t('subscriptions:invalidDiscountCode')
      : undefined;
  const referralErrorMessage =
    !isLoading && !paymentData.isValid && referralCode
      ? t(referralRejectionKey(paymentData.error) ?? 'subscriptions:invalidReferralCode')
      : undefined;

  return (
    <form onSubmit={handleSubmit(handleInternalSubmit)} className='grid h-full grid-rows-[1fr_auto]'>
      <div className='grid content-start gap-8'>
        <CheckoutPurchaseModeSelector value={purchaseMode} onChange={handlePurchaseModeChange} showDuo={showDuo} />

        {isGift ? (
          <EmailField
            control={control}
            name='gift_recipient_email'
            label={t('gifts:recipientEmail')}
            placeholder={t('common:placeholder.email')}
            errorMessage={giftEligibilityError ?? undefined}
            helperText={t('gifts:startDateGiftNote')}
          />
        ) : null}

        {isDuo ? (
          <div className='grid gap-4'>
            <p className='m-0 text-sm font-medium text-gray-900'>{t('subscriptions:duoDetailsTitle')}</p>
            <EmailField
              control={control}
              name='duo_partner_email'
              label={t('subscriptions:duoPartnerEmail')}
              placeholder={t('common:placeholder.email')}
              errorMessage={duoPartnerError ?? undefined}
            />
            <DateField
              control={control}
              name='start_date'
              min={new Date()}
              max={addMonths(new Date(), 1)}
              label={t('subscriptions:startDate')}
              helperText={t('subscriptions:duoStartDateHelp')}
            />
            <div className='grid gap-2'>
              <div className='flex items-center justify-between gap-2'>
                <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:duoYourClasses')}</span>
                <span className='shrink-0'>{t('subscriptions:duoClassesCount', { count: duoHalfClasses })}</span>
              </div>
              <div className='flex items-center justify-between gap-2'>
                <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:duoPartnerClasses')}</span>
                <span className='shrink-0'>{t('subscriptions:duoClassesCount', { count: duoHalfClasses })}</span>
              </div>
            </div>
          </div>
        ) : null}

        {purchaseMode === 'self' ? (
          <DateField
            control={control}
            name='start_date'
            min={new Date()}
            max={addMonths(new Date(), 1)}
            label={t('subscriptions:startDate')}
            helperText={t('subscriptions:startDateHelp')}
          />
        ) : null}

        {showMergedCodeTabs ? (
          <div className='grid gap-3'>
            <p className='m-0 text-sm font-medium text-gray-900'>{t('subscriptions:codeQuestion')}</p>
            <Tabs value={codeKind} onValueChange={handleCodeKindChange}>
              <TabsList className='h-10 w-full rounded-full bg-gray-200/50 p-1'>
                <TabsTrigger className='rounded-full data-[state=active]:text-primary' value='discount'>
                  {t('subscriptions:codeTypeDiscount')}
                </TabsTrigger>
                <TabsTrigger className='rounded-full data-[state=active]:text-primary' value='referral'>
                  {t('subscriptions:codeTypeReferral')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            {codeKind === 'discount' ? (
              <TextField
                hideLabel
                inputClassName='uppercase'
                control={control}
                name='discount_code'
                disabled={codeFieldDisabled}
                rightElement={isLoading ? <Spinner /> : undefined}
                placeholder={t('subscriptions:discountCodePlaceholder')}
                label={t('subscriptions:discountCodeLabel')}
                helperText={t('subscriptions:codeOnePerPurchase')}
                errorMessage={discountErrorMessage}
              />
            ) : (
              <TextField
                hideLabel
                inputClassName='uppercase'
                control={control}
                name='referral_code'
                disabled={codeFieldDisabled}
                rightElement={isLoading ? <Spinner /> : undefined}
                placeholder={t('subscriptions:referralCodePlaceholder')}
                label={t('subscriptions:referralCodeLabel')}
                helperText={t('subscriptions:codeOnePerPurchaseReferralNote')}
                errorMessage={referralErrorMessage}
              />
            )}
          </div>
        ) : null}

        {showSingleDiscountField ? (
          <TextField
            inputClassName='uppercase'
            control={control}
            name='discount_code'
            disabled={codeFieldDisabled}
            rightElement={isLoading ? <Spinner /> : undefined}
            placeholder={t('subscriptions:discountCodePlaceholder')}
            label={isGift ? t('subscriptions:giftDiscountCodeLabel') : t('subscriptions:codeQuestion')}
            helperText={t('subscriptions:codeOnePerPurchase')}
            errorMessage={discountErrorMessage}
          />
        ) : null}
      </div>

      <div className='flex flex-wrap justify-end gap-2 pt-4'>
        <Button type='button' className='flex items-center' variant='outlined' color='primary' onClick={onCancel}>
          <LuX />
          {t('common:cancel')}
        </Button>

        <Button isLoading={isLoading} color='primary' className='flex items-center'>
          {t('common:next')}
          <LuArrowRight />
        </Button>
      </div>
    </form>
  );
}
