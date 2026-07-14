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

import { DateField, TextField } from '@components/form-fields';
import { Spinner } from '@components/loaders';
import { DansshipAPI, PaymentPreviewRequest, PublicPlan } from '@core/api';
import { formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

const createCheckoutSchema = (t: TFunction) =>
  z.object({
    start_date: z.date().refine(
      date => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date >= today;
      },
      { message: t('subscriptions:dateInPast') },
    ),
    discount_code: z.string(),
  });

export type CheckoutFormValues = z.infer<ReturnType<typeof createCheckoutSchema>>;

export interface PaymentData {
  discountCode: string;
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
}

export const DefaultPaymentData: PaymentData = {
  taxContext: '',
  discountContext: '',
  discountCode: '',
  error: '',
  isValid: false,
  discountValue: 0,
  finalPrice: 0,
  baseAmount: 0,
  originalPrice: 0,
  taxAmount: 0,
  applied: false,
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
  const [paymentData, setPaymentData] = useState<PaymentData>({
    ...DefaultPaymentData,
    finalPrice: plan.price,
  });
  const { call: previewPayment, isLoading } = useCallablePromise((payload: PaymentPreviewRequest) =>
    DansshipAPI.payments.previewPayment(payload),
  );

  const { handleSubmit, watch, control } = useForm<CheckoutFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createCheckoutSchema(t)),
    defaultValues: defaultFormValues,
  });

  const discountCode = useDebounce(watch('discount_code'), 800);

  const getPaymentPreview = useCallback(async () => {
    previewPayment({
      plan_id: plan.id,
      discount_code: discountCode ? discountCode.toUpperCase() : undefined,
    }).then(({ data, ok }) => {
      if (ok) {
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
        } = data;

        setPaymentData({
          isValid: is_valid,
          discountCode: discountCode.toUpperCase(),
          error: rejection_reason || '',
          applied: discount_applied,
          discountValue: discount_value,
          finalPrice: final_price,
          baseAmount: base_amount,
          originalPrice: original_price,
          taxAmount: tax_amount,
          taxContext: `${tax_rate_percentage}%`,
          discountContext:
            discount_type === 'percentage'
              ? `${discount_value}%`
              : discount_type === 'fixed_amount'
                ? formatPrice(discount_value, plan.currency)
                : '',
        });
      }
    });
  }, [discountCode, plan.currency, plan.id, previewPayment]);

  useEffect(() => {
    void getPaymentPreview();
  }, [getPaymentPreview]);

  const handleInternalSubmit = useCallback(
    async (formData: CheckoutFormValues) => {
      await onSubmit(formData, paymentData);
    },
    [paymentData, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit(handleInternalSubmit)} className='grid grid-rows-[1fr_auto] h-full'>
      <div className='grid gap-8 content-start'>
        <DateField
          control={control}
          name='start_date'
          min={new Date()}
          max={addMonths(new Date(), 1)}
          label={t('subscriptions:startDate')}
        />

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
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-gray-500'>{t('subscriptions:subtotal')}</span>
            <span>{formatPrice(paymentData.baseAmount, plan.currency)}</span>
          </div>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-gray-500'>{t('subscriptions:iva')}</span>
            <span>{formatPrice(paymentData.taxAmount, plan.currency)}</span>
          </div>
          {paymentData.applied && (
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-gray-500'>{t('subscriptions:discountCode')}</span>
              <span>{isLoading ? <Spinner /> : paymentData.discountContext}</span>
            </div>
          )}

          <div className='mt-4 flex items-center justify-between border-t pt-4 text-lg font-bold'>
            <span>{t('subscriptions:totalDue')}</span>
            <span>{formatPrice(paymentData.finalPrice, plan.currency)}</span>
          </div>
        </div>

        <section className='justify-self-end text-label w-90'>
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

        <div className='flex justify-end gap-2 pt-4'>
          <Button type='button' className='flex items-center' variant='outlined' color='primary' onClick={onCancel}>
            <LuX />
            {t('common:cancel')}
          </Button>

          <Button
            isLoading={isLoading}
            disabled={(Boolean(discountCode) && !paymentData.isValid) || !termsAndConditions}
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
