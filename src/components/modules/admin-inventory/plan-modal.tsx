import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import { Plan } from '@core/api';

const PLAN_CURRENCY = 'COP' as const;

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  currency: z.string().min(3, 'Currency must be 3 characters').max(3),
  classes_included: z.coerce.number().min(1, 'Must include at least 1 class'),
  validity_days: z.coerce.number().min(1, 'Must be valid for at least 1 day'),
});

type PlanFormValues = z.infer<typeof planSchema>;

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlanFormValues) => void;
  initialData?: Plan | null;
  isLoading?: boolean;
}

export function PlanModal({ isOpen, onClose, onSubmit, initialData, isLoading }: PlanModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      currency: PLAN_CURRENCY,
      classes_included: 1,
      validity_days: 30,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description || '',
          price: initialData.price,
          currency: initialData.currency,
          classes_included: initialData.classes_included,
          validity_days: initialData.validity_days,
        });
      } else {
        reset({
          name: '',
          description: '',
          price: 0,
          currency: PLAN_CURRENCY,
          classes_included: 1,
          validity_days: 30,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? t('billing:editPlan') : t('billing:createPlan')}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>{t('billing:planName')}</Label>
            <Input id='name' {...register('name')} placeholder={t('billing:planNamePlaceholder')} />
            {errors.name && <p className='text-sm text-alert-500'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>{t('billing:descriptionOptional')}</Label>
            <Input id='description' {...register('description')} placeholder={t('billing:planDescPlaceholder')} />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='price'>{t('billing:price')}</Label>
              <Input id='price' type='number' step='0.01' {...register('price')} />
              {errors.price && <p className='text-sm text-alert-500'>{errors.price.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='currency'>{t('billing:currency')}</Label>
              <Select
                value={watch('currency') || PLAN_CURRENCY}
                onValueChange={val =>
                  setValue('currency', val, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('billing:selectCurrency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PLAN_CURRENCY}>{PLAN_CURRENCY}</SelectItem>
                </SelectContent>
              </Select>
              {errors.currency && <p className='text-sm text-alert-500'>{errors.currency.message}</p>}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='classes_included'>{t('billing:classesIncluded')}</Label>
              <Input id='classes_included' type='number' {...register('classes_included')} />
              {errors.classes_included && <p className='text-sm text-alert-500'>{errors.classes_included.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='validity_days'>{t('billing:validityDays')}</Label>
              <Input id='validity_days' type='number' {...register('validity_days')} />
              {errors.validity_days && <p className='text-sm text-alert-500'>{errors.validity_days.message}</p>}
            </div>
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? t('common:saving') : t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
