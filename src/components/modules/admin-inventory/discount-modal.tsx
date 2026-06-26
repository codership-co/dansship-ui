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
import { Discount } from '@core/api';

const discountSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount']),
  value: z.coerce.number().min(0, 'Value must be positive'),
  expiration_date: z.string().optional(),
  usage_limit_global: z.coerce.number().optional(),
  usage_limit_per_user: z.coerce.number().optional(),
});

type DiscountFormValues = z.infer<typeof discountSchema>;

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DiscountFormValues) => void;
  initialData?: Discount | null;
  isLoading?: boolean;
}

export function DiscountModal({ isOpen, onClose, onSubmit, initialData, isLoading }: DiscountModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DiscountFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(discountSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      type: 'percentage',
      value: 0,
      expiration_date: '',
      usage_limit_global: 0,
      usage_limit_per_user: 0,
    },
  });

  const typeValue = watch('type');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          code: initialData.code,
          description: initialData.description || '',
          type: initialData.type,
          value: initialData.value,
          expiration_date: initialData.expiration_date ? initialData.expiration_date.slice(0, 16) : '',
          usage_limit_global: initialData.usage_limit_global || 0,
          usage_limit_per_user: initialData.usage_limit_per_user || 0,
        });
      } else {
        reset({
          name: '',
          code: '',
          description: '',
          type: 'percentage',
          value: 0,
          expiration_date: '',
          usage_limit_global: 0,
          usage_limit_per_user: 0,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? t('billing:editDiscount') : t('billing:createDiscount')}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>{t('billing:discountName')}</Label>
              <Input id='name' {...register('name')} placeholder={t('billing:discountNamePlaceholder')} />
              {errors.name && <p className='text-sm text-alert-500'>{errors.name.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='code'>{t('billing:discountCode')}</Label>
              <Input id='code' {...register('code')} placeholder={t('billing:discountCodePlaceholder')} />
              {errors.code && <p className='text-sm text-alert-500'>{errors.code.message}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>{t('billing:descriptionOptional')}</Label>
            <Input id='description' {...register('description')} placeholder={t('billing:discountDescPlaceholder')} />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>{t('billing:discountType')}</Label>
              <Select value={typeValue} onValueChange={(val: 'percentage' | 'fixed_amount') => setValue('type', val)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('billing:selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='percentage'>{t('billing:typePercentage')}</SelectItem>
                  <SelectItem value='fixed_amount'>{t('billing:typeFixedAmount')}</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className='text-sm text-alert-500'>{errors.type.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='value'>{t('billing:value')}</Label>
              <Input id='value' type='number' step='0.01' {...register('value')} />
              {errors.value && <p className='text-sm text-alert-500'>{errors.value.message}</p>}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='expiration_date'>{t('billing:expirationDateOptional')}</Label>
              <Input id='expiration_date' type='datetime-local' {...register('expiration_date')} />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='usage_limit_global'>{t('billing:globalUsageLimit')}</Label>
                <Input
                  id='usage_limit_global'
                  type='number'
                  {...register('usage_limit_global')}
                  placeholder={t('billing:globalUsagePlaceholder')}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='usage_limit_per_user'>{t('billing:perUserUsageLimit')}</Label>
                <Input
                  id='usage_limit_per_user'
                  type='number'
                  {...register('usage_limit_per_user')}
                  placeholder={t('billing:perUserUsagePlaceholder')}
                />
              </div>
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
