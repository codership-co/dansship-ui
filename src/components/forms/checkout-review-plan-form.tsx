import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { DateField, TextField } from '@components/form-fields';
import { Spinner } from '@components/loaders';
import { Button } from '@components/ui';
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

  const { handleSubmit, control } = useForm<CheckoutFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createCheckoutSchema(t)),
    defaultValues: defaultFormValues,
  });

  const handleInternalSubmit = useCallback(
    async (formData: CheckoutFormValues) => {
      const { discount_code } = formData;
      let discountData = DefaultDiscountData;

      if (!discount_code) {
        await onSubmit(formData, discountData);

        return;
      } else {
        const { data, ok } = await previewDiscount({
          plan_id: plan.id,
          discount_code,
        });

        if (ok) {
          const { discount_type, rejection_reason, is_valid, discount_applied, final_price, discount_value } = data;
          const value = discount_value ? Number(data.discount_value) : 0;

          discountData = {
            isValid: !!is_valid,
            discountCode: discount_code.toUpperCase(),
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
          };

          setDiscountData(discountData);

          if (is_valid) {
            await onSubmit(formData, discountData);
          }
        }
      }
    },
    [onSubmit, plan.currency, plan.id, plan.price, previewDiscount],
  );

  return (
    <form onSubmit={handleSubmit(handleInternalSubmit)} className='space-y-6'>
      <div className='grid gap-8'>
        <DateField control={control} name='start_date' min={new Date()} label={t('subscriptions:startDate')} />

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
          <Button type='button' variant='outline' onClick={onCancel}>
            {t('common:cancel')}
          </Button>

          <Button disabled={isLoading}>{t('common:next')}</Button>
        </div>
      </div>
    </form>
  );
};
