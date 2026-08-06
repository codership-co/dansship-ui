import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button, Checkbox } from 'polpo/components';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { z } from 'zod';

import { EmailField, TextareaField, TextField } from '@components/form-fields';
import { CheckoutFormValues } from '@components/forms/checkout-review-plan-form';
import { useAuth } from '@contexts';

const createGiftDetailsSchema = (t: TFunction) =>
  z
    .object({
      gift_recipient_name: z.string(),
      gift_recipient_email: z.string(),
      gift_message: z.string(),
      gift_is_anonymous: z.boolean(),
      gift_sender_display_name: z.string(),
    })
    .superRefine((data, ctx) => {
      if (!data.gift_recipient_name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation:required'),
          path: ['gift_recipient_name'],
        });
      }

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

      if (!data.gift_is_anonymous && !data.gift_sender_display_name.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation:required'),
          path: ['gift_sender_display_name'],
        });
      }
    });

type GiftDetailsFormValues = z.infer<ReturnType<typeof createGiftDetailsSchema>>;

interface CheckoutGiftDetailsFormProps {
  defaultFormValues: CheckoutFormValues;
  onBack: () => void;
  onSubmit: (data: CheckoutFormValues) => Promise<void>;
}

export function CheckoutGiftDetailsForm({ defaultFormValues, onBack, onSubmit }: CheckoutGiftDetailsFormProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();

  const { handleSubmit, watch, control, setValue } = useForm<GiftDetailsFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createGiftDetailsSchema(t)),
    defaultValues: {
      gift_recipient_name: defaultFormValues.gift_recipient_name,
      gift_recipient_email: defaultFormValues.gift_recipient_email,
      gift_message: defaultFormValues.gift_message,
      gift_is_anonymous: defaultFormValues.gift_is_anonymous,
      gift_sender_display_name: defaultFormValues.gift_sender_display_name,
    },
  });

  const giftIsAnonymous = watch('gift_is_anonymous');

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const senderName = user.fullName || user.displayName || user.name || '';

    if (senderName && !defaultFormValues.gift_sender_display_name) {
      setValue('gift_sender_display_name', senderName);
    }
  }, [defaultFormValues.gift_sender_display_name, isAuthenticated, setValue, user]);

  const handleInternalSubmit = useCallback(
    async (formData: GiftDetailsFormValues) => {
      await onSubmit({
        ...defaultFormValues,
        is_gift: true,
        start_date: undefined,
        gift_recipient_name: formData.gift_recipient_name.trim(),
        gift_recipient_email: formData.gift_recipient_email.trim(),
        gift_message: formData.gift_message,
        gift_is_anonymous: formData.gift_is_anonymous,
        gift_sender_display_name: formData.gift_is_anonymous ? '' : formData.gift_sender_display_name.trim(),
      });
    },
    [defaultFormValues, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit(handleInternalSubmit)} className='grid grid-rows-[1fr_auto] h-full'>
      <div className='grid gap-6 content-start'>
        <TextField
          control={control}
          name='gift_recipient_name'
          label={t('gifts:recipientName')}
          placeholder={t('gifts:recipientNamePlaceholder')}
        />
        <EmailField
          control={control}
          name='gift_recipient_email'
          label={t('gifts:recipientEmail')}
          placeholder={t('common:placeholder.email')}
        />
        <TextareaField
          control={control}
          name='gift_message'
          label={t('gifts:message')}
          placeholder={t('gifts:messagePlaceholder')}
          rows={3}
        />
        <Checkbox
          label={t('gifts:anonymous')}
          name='gift_is_anonymous'
          value={giftIsAnonymous}
          setValue={() => setValue('gift_is_anonymous', !giftIsAnonymous)}
        />
        {!giftIsAnonymous ? (
          <TextField
            control={control}
            name='gift_sender_display_name'
            label={t('gifts:senderDisplayName')}
            placeholder={t('gifts:senderDisplayNamePlaceholder')}
          />
        ) : null}
      </div>

      <div className='flex flex-wrap justify-end gap-2 pt-4'>
        <Button type='button' className='flex items-center' variant='outlined' color='primary' onClick={onBack}>
          <LuArrowLeft />
          {t('common:back')}
        </Button>
        <Button color='primary' className='flex items-center'>
          {t('common:next')}
          <LuArrowRight />
        </Button>
      </div>
    </form>
  );
}
