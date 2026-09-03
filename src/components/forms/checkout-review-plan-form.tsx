import { TFunction } from 'i18next';
import { Button, Checkbox } from 'polpo/components';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { z } from 'zod';

import { PaymentMethodSelector } from '@components/modules/payments/payment-method-selector';
import { PaymentMethod, PublicPlan } from '@core/api';
import { formatPrice } from '@helpers';

export const createCheckoutReviewSchema = (t: TFunction) =>
  z
    .object({
      purchase_mode: z.enum(['self', 'gift', 'duo']),
      start_date: z.date().optional(),
      discount_code: z.string(),
      referral_code: z.string(),
      is_gift: z.boolean(),
      gift_recipient_name: z.string(),
      gift_recipient_email: z.string(),
      gift_message: z.string(),
      gift_is_anonymous: z.boolean(),
      gift_sender_display_name: z.string(),
      duo_partner_email: z.string(),
    })
    .superRefine((data, ctx) => {
      if (data.purchase_mode === 'gift') {
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

      if (data.purchase_mode === 'duo') {
        if (!data.duo_partner_email.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation:required'),
            path: ['duo_partner_email'],
          });
        } else if (!z.string().email().safeParse(data.duo_partner_email.trim()).success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation:email'),
            path: ['duo_partner_email'],
          });
        }
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
  purchase_mode: 'self',
  start_date: new Date(),
  discount_code: '',
  referral_code: '',
  is_gift: false,
  gift_recipient_name: '',
  gift_recipient_email: '',
  gift_message: '',
  gift_is_anonymous: false,
  gift_sender_display_name: '',
  duo_partner_email: '',
};

interface CheckoutPayFormProps {
  plan: PublicPlan;
  checkoutData: CheckoutFormValues;
  paymentData: PaymentData;
  paymentMethod: PaymentMethod | null;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  isWalletCovered: boolean;
  onBack: () => void;
  onSubmit: () => void;
}

export function CheckoutPayForm({
  plan,
  checkoutData,
  paymentData,
  paymentMethod,
  onPaymentMethodChange,
  isWalletCovered,
  onBack,
  onSubmit,
}: CheckoutPayFormProps) {
  const { t } = useTranslation();
  const [termsAndConditions, setTermsAndConditions] = useState(false);
  const isDuo = checkoutData.purchase_mode === 'duo';

  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
      className='grid h-full grid-rows-[1fr_auto]'
    >
      <div className='grid content-start gap-8'>
        <div>
          <div className='mb-2 flex items-center justify-between gap-2'>
            <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:subtotal')}</span>
            <span className='shrink-0'>{formatPrice(paymentData.baseAmount, plan.currency)}</span>
          </div>
          <div className='mb-2 flex items-center justify-between gap-2'>
            <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:iva')}</span>
            <span className='shrink-0'>{formatPrice(paymentData.taxAmount, plan.currency)}</span>
          </div>
          {!isDuo && paymentData.applied && (
            <div className='mb-2 flex items-center justify-between gap-2'>
              <span className='min-w-0 break-words text-gray-500'>
                {paymentData.discountBenefitCode === 'REFERRAL_FIXED_20000'
                  ? t('subscriptions:discountReferral')
                  : paymentData.discountBenefitCode === 'FIRST_PLAN_PCT_10'
                    ? t('subscriptions:discountFirstPlan')
                    : paymentData.discountCode
                      ? t('subscriptions:discountCode')
                      : t('subscriptions:discount')}
              </span>
              <span className='shrink-0'>{paymentData.discountContext}</span>
            </div>
          )}

          {!isDuo && paymentData.bonusClassesGranted !== null && paymentData.bonusClassesGranted > 0 && (
            <div className='mb-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary'>
              {t('subscriptions:bonusClassesCheckoutNote', {
                count: paymentData.bonusClassesGranted,
                days: paymentData.bonusExpiresDays ?? 14,
              })}
            </div>
          )}

          {paymentData.walletAmountApplied > 0 && (
            <div className='mb-2 flex items-center justify-between gap-2'>
              <span className='min-w-0 break-words text-primary'>{t('subscriptions:walletApplied')}</span>
              <span className='shrink-0 text-primary'>
                -{formatPrice(paymentData.walletAmountApplied, plan.currency)}
              </span>
            </div>
          )}

          <div className='mt-4 flex items-center justify-between gap-2 border-t pt-4 text-lg font-bold'>
            <span className='min-w-0 break-words'>{t('subscriptions:totalDue')}</span>
            <span className='shrink-0'>{formatPrice(paymentData.amountToCharge, plan.currency)}</span>
          </div>
        </div>

        {isWalletCovered ? (
          <div className='rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-gray-700'>
            <p className='m-0 font-semibold text-primary'>{t('subscriptions:walletFullyCoveredNote')}</p>
          </div>
        ) : (
          <PaymentMethodSelector value={paymentMethod} onChange={onPaymentMethodChange} />
        )}
      </div>

      <section className='grid gap-2'>
        <section className='w-full max-w-90 justify-self-end text-label'>
          <Checkbox
            label={
              <Trans
                i18nKey='subscriptions:terms'
                components={{
                  LinkTerms: (
                    <a
                      target='_blank'
                      href='/assets/legal/terminos-y-condiciones-servicio.pdf'
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
          <Button type='button' className='flex items-center' variant='outlined' color='primary' onClick={onBack}>
            <LuArrowLeft />
            {t('common:back')}
          </Button>

          <Button
            disabled={!termsAndConditions || (!isWalletCovered && !paymentMethod)}
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
}
