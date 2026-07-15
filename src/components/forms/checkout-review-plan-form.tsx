import { zodResolver } from '@hookform/resolvers/zod';
import { addMonths } from 'date-fns';
import { TFunction } from 'i18next';
import { Button, Checkbox } from 'polpo/components';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { LuArrowRight, LuX } from 'react-icons/lu';
import { z } from 'zod';

import { DateField, TextField } from '@components/form-fields';
import { Spinner } from '@components/loaders';
import { PublicPlan } from '@core/api';
import { formatPrice } from '@helpers';
import { CheckoutPaymentPreview } from '@hooks';

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

interface CheckoutReviewPlanFormInputProps {
  plan: PublicPlan;
  preview: CheckoutPaymentPreview | null;
  isPreviewLoading: boolean;
  onCancel: () => void;
  onDiscountCodeChange: (discountCode: string) => void;
  onSubmit: (data: CheckoutFormValues, preview: CheckoutPaymentPreview) => Promise<void>;
  defaultFormValues: CheckoutFormValues;
}

export const CheckoutReviewPlanFormInput = ({
  plan,
  preview,
  isPreviewLoading,
  onCancel,
  onDiscountCodeChange,
  onSubmit,
  defaultFormValues,
}: CheckoutReviewPlanFormInputProps) => {
  const { t } = useTranslation();
  const [termsAndConditions, setTermsAndConditions] = useState(false);

  const { handleSubmit, watch, control } = useForm<CheckoutFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createCheckoutSchema(t)),
    defaultValues: defaultFormValues,
  });

  const discountCode = watch('discount_code');

  useEffect(() => {
    onDiscountCodeChange(discountCode);
  }, [discountCode, onDiscountCodeChange]);

  const discountContext =
    preview?.discountType === 'percentage'
      ? `${preview.discountValue}%`
      : preview?.discountType === 'fixed_amount'
        ? formatPrice(preview.discountValue, plan.currency)
        : '';

  const hasDiscountCode = Boolean(preview?.discountCode);
  const canContinue = preview !== null && (!hasDiscountCode || preview.isValid);

  const handleInternalSubmit = useCallback(
    async (formData: CheckoutFormValues) => {
      if (!preview) {
        return;
      }

      await onSubmit(formData, preview);
    },
    [onSubmit, preview],
  );

  return (
    <form
      data-component='CheckoutReviewPlanFormInput'
      onSubmit={handleSubmit(handleInternalSubmit)}
      className='grid grid-rows-[1fr_auto] h-full'
    >
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
          disabled={isPreviewLoading}
          rightElement={isPreviewLoading ? <Spinner /> : undefined}
          placeholder={t('subscriptions:discountCodePlaceholder')}
          label={t('subscriptions:discountCodeLabel')}
          helperText={preview?.isValid && hasDiscountCode ? t('subscriptions:codeValidationNote') : undefined}
          errorMessage={
            !isPreviewLoading && hasDiscountCode && preview && !preview.isValid
              ? t('subscriptions:invalidDiscountCode')
              : undefined
          }
        />
      </div>

      <section className='grid gap-2'>
        <div>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-gray-500'>{t('subscriptions:subtotal')}</span>
            <span>{isPreviewLoading || !preview ? <Spinner /> : formatPrice(preview.baseAmount, plan.currency)}</span>
          </div>
          <div className='mb-2 flex items-center justify-between'>
            <span className='text-gray-500'>
              {preview ? `${preview.taxTypeName} (${preview.taxRatePercentage}%)` : t('subscriptions:iva')}
            </span>
            <span>{isPreviewLoading || !preview ? <Spinner /> : formatPrice(preview.taxAmount, plan.currency)}</span>
          </div>
          {preview?.discountApplied && (
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-gray-500'>{t('subscriptions:discountCode')}</span>
              <span>{isPreviewLoading ? <Spinner /> : discountContext}</span>
            </div>
          )}

          <div className='mt-4 flex items-center justify-between border-t pt-4 text-lg font-bold'>
            <span>{t('subscriptions:totalDue')}</span>
            <span>{isPreviewLoading || !preview ? <Spinner /> : formatPrice(preview.finalPrice, plan.currency)}</span>
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
            isLoading={isPreviewLoading}
            disabled={!canContinue || !termsAndConditions}
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
