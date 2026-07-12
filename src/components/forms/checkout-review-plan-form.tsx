import { zodResolver } from '@hookform/resolvers/zod';
import { addMonths } from 'date-fns';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useDebounce } from 'polpo/hooks';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowRight, LuX } from 'react-icons/lu';
import { z } from 'zod';

import { DateField, TextField } from '@components/form-fields';
import { Spinner } from '@components/loaders';
import { DansshipAPI, DiscountPreviewRequest, PublicPlan } from '@core/api';
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

export interface DiscountData {
  discountCode: string;
  context: string;
  error: string;
  isValid: boolean;
  value: number;
  finalPrice: number;
  applied: boolean;
}

export const DefaultDiscountData: DiscountData = {
  context: '',
  discountCode: '',
  error: '',
  isValid: false,
  value: 0,
  finalPrice: 0,
  applied: false,
};

interface CheckoutReviewPlanFormInputProps {
  plan: PublicPlan;
  onCancel: () => void;
  onSubmit: (data: CheckoutFormValues, discountData: DiscountData) => Promise<void>;
  defaultFormValues: CheckoutFormValues;
}

export const CheckoutReviewPlanFormInput = ({
  plan,
  onCancel,
  onSubmit,
  defaultFormValues,
}: CheckoutReviewPlanFormInputProps) => {
  const { t } = useTranslation();
  const [discountData, setDiscountData] = useState<DiscountData>({
    ...DefaultDiscountData,
    finalPrice: plan.price,
  });
  const { call: previewDiscount, isLoading } = useCallablePromise((payload: DiscountPreviewRequest) =>
    DansshipAPI.subscriptions.previewDiscount(payload),
  );

  const { handleSubmit, watch, control } = useForm<CheckoutFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createCheckoutSchema(t)),
    defaultValues: defaultFormValues,
  });

  const discountCode = useDebounce(watch('discount_code'), 800);

  useEffect(() => {
    if (discountCode) {
      previewDiscount({
        plan_id: plan.id,
        discount_code: discountCode.toUpperCase(),
      }).then(({ data, ok }) => {
        if (ok) {
          const { discount_type, rejection_reason, is_valid, discount_applied, final_price, discount_value } = data;
          const value = discount_value ? Number(data.discount_value) : 0;

          setDiscountData({
            isValid: !!is_valid,
            discountCode: discountCode.toUpperCase(),
            error: rejection_reason || '',
            applied: Boolean(discount_applied),
            value,
            finalPrice: Number(final_price) || plan.price,
            context:
              discount_type === 'percentage'
                ? `${value}%`
                : discount_type === 'fixed_amount'
                  ? formatPrice(value, plan.currency)
                  : '',
          });
        }
      });
    } else {
      setDiscountData({
        ...DefaultDiscountData,
        finalPrice: plan.price,
      });
    }
  }, [discountCode, plan.currency, plan.id, plan.price, previewDiscount]);

  const handleInternalSubmit = useCallback(
    async (formData: CheckoutFormValues) => {
      await onSubmit(formData, discountData);
    },
    [discountData, onSubmit],
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
          helperText={discountData.isValid ? t('subscriptions:codeValidationNote') : undefined}
          errorMessage={
            !isLoading && !discountData.isValid && discountData.discountCode
              ? t('subscriptions:invalidDiscountCode')
              : undefined
          }
        />
      </div>

      <section className='grid gap-8'>
        <div className='pt-20'>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-gray-500'>{t('subscriptions:subtotal')}</span>
            <span>{formatPrice(plan.price * 0.81, plan.currency)}</span>
          </div>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-gray-500'>{t('subscriptions:iva')}</span>
            <span>{formatPrice(plan.price * 0.19, plan.currency)}</span>
          </div>
          {discountData.isValid && (
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-gray-500'>{t('subscriptions:discountCode')}</span>
              <span>{isLoading ? <Spinner /> : formatPrice(discountData.value, plan.currency)}</span>
            </div>
          )}

          <div className='mt-4 flex items-center justify-between border-t pt-4 text-lg font-bold'>
            <span>{t('subscriptions:totalDue')}</span>
            <span>{formatPrice(discountData.finalPrice, plan.currency)}</span>
          </div>
        </div>

        <div className='flex justify-end gap-2 pt-4'>
          <Button type='button' className='flex items-center' variant='outlined' color='primary' onClick={onCancel}>
            <LuX />
            {t('common:cancel')}
          </Button>

          <Button
            isLoading={isLoading}
            disabled={!!discountCode && !discountData.isValid}
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
