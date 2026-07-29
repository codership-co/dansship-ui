import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
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
  Switch,
} from '@components/ui';
import { ClassGroup, Plan, TaxType } from '@core/api';

const PLAN_CURRENCY = 'COP' as const;

const planSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  currency: z.string().min(3, 'Currency must be 3 characters').max(3),
  tax_type_id: z.guid({ error: 'Tax type is required' }),
  classes_included: z.coerce.number().min(1, 'Must include at least 1 class'),
  validity_days: z.coerce.number().min(1, 'Must be valid for at least 1 day'),
  features: z.array(z.object({ value: z.string().min(1, 'Feature is required') })),
  show_on_landing: z.boolean(),
  is_recommended: z.boolean(),
  recommended_order: z.string().optional(),
  class_group_allowances: z
    .array(
      z.object({
        class_group_id: z.guid({ error: 'Class group is required' }),
        max_classes: z.string().optional(),
      }),
    )
    .min(1, 'At least one class group allowance is required'),
});

export type PlanFormValues = z.infer<typeof planSchema>;

export type PlanModalSubmitData = {
  name: string;
  description?: string;
  price: number;
  currency: string;
  tax_type_id: string;
  classes_included: number;
  validity_days: number;
  features: Array<string>;
  show_on_landing: boolean;
  is_recommended: boolean;
  recommended_order?: number | null;
  class_group_allowances: Array<{
    class_group_id: string;
    max_classes?: number | null;
  }>;
};

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlanModalSubmitData) => void | Promise<void>;
  initialData?: Plan | null;
  classGroups: Array<ClassGroup>;
  taxTypes: Array<TaxType>;
  defaultTaxTypeId: string;
  isLoading?: boolean;
}

function parseRecommendedOrder(value?: string): number | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function parseMaxClasses(value?: string): number | null {
  if (value === undefined || value === null || value.trim() === '') {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function PlanModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  classGroups,
  taxTypes,
  defaultTaxTypeId,
  isLoading,
}: PlanModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
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
      tax_type_id: '',
      classes_included: 1,
      validity_days: 30,
      features: [],
      show_on_landing: false,
      is_recommended: false,
      recommended_order: '',
      class_group_allowances: [],
    },
  });

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray({ control, name: 'features' });

  const {
    fields: allowanceFields,
    append: appendAllowance,
    remove: removeAllowance,
  } = useFieldArray({ control, name: 'class_group_allowances' });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description || '',
        price: initialData.price,
        currency: initialData.currency,
        tax_type_id: initialData.tax_type_id || defaultTaxTypeId,
        classes_included: initialData.classes_included,
        validity_days: initialData.validity_days,
        features: (initialData.features ?? []).map(value => ({ value })),
        show_on_landing: initialData.show_on_landing ?? false,
        is_recommended: initialData.is_recommended ?? false,
        recommended_order:
          initialData.recommended_order !== null && initialData.recommended_order !== undefined
            ? String(initialData.recommended_order)
            : '',
        class_group_allowances:
          initialData.class_group_allowances?.length > 0
            ? initialData.class_group_allowances.map(item => ({
                class_group_id: item.class_group_id,
                max_classes:
                  item.max_classes !== null && item.max_classes !== undefined ? String(item.max_classes) : '',
              }))
            : [
                {
                  class_group_id: classGroups[0]?.id ?? '',
                  max_classes: '',
                },
              ],
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        currency: PLAN_CURRENCY,
        tax_type_id: defaultTaxTypeId,
        classes_included: 1,
        validity_days: 30,
        features: [],
        show_on_landing: false,
        is_recommended: false,
        recommended_order: '',
        class_group_allowances: [
          {
            class_group_id: classGroups[0]?.id ?? '',
            max_classes: '',
          },
        ],
      });
    }
  }, [isOpen, initialData, reset, defaultTaxTypeId, classGroups]);

  const handleFormSubmit = (values: PlanFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description,
      price: values.price,
      currency: values.currency,
      tax_type_id: values.tax_type_id,
      classes_included: values.classes_included,
      validity_days: values.validity_days,
      features: values.features.map(item => item.value.trim()).filter(Boolean),
      show_on_landing: values.show_on_landing,
      is_recommended: values.is_recommended,
      recommended_order: parseRecommendedOrder(values.recommended_order),
      class_group_allowances: values.class_group_allowances.map(item => ({
        class_group_id: item.class_group_id,
        max_classes: parseMaxClasses(item.max_classes),
      })),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{initialData ? t('billing:editPlan') : t('billing:createPlan')}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
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

          <div className='space-y-2'>
            <Label htmlFor='tax_type_id'>{t('billing:taxType')}</Label>
            <Select
              value={watch('tax_type_id') || undefined}
              onValueChange={val =>
                setValue('tax_type_id', val, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('billing:selectTaxType')} />
              </SelectTrigger>
              <SelectContent>
                {taxTypes.map(taxType => (
                  <SelectItem key={taxType.id} value={taxType.id}>
                    {taxType.name}
                    {taxType.current_percentage !== null && taxType.current_percentage !== undefined
                      ? ` (${taxType.current_percentage}%)`
                      : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tax_type_id && <p className='text-sm text-alert-500'>{errors.tax_type_id.message}</p>}
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

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <Label>{t('billing:features')}</Label>
              <Button type='button' variant='outline' size='sm' onClick={() => appendFeature({ value: '' })}>
                {t('billing:addFeature')}
              </Button>
            </div>
            <p className='text-xs text-gray-500'>{t('billing:featuresHint')}</p>
            {featureFields.length === 0 ? (
              <p className='text-sm text-gray-500'>{t('billing:noFeatures')}</p>
            ) : (
              featureFields.map((field, index) => (
                <div key={field.id} className='flex gap-2'>
                  <Input {...register(`features.${index}.value`)} placeholder={t('billing:featurePlaceholder')} />
                  <Button type='button' variant='outline' size='sm' onClick={() => removeFeature(index)}>
                    {t('common:remove')}
                  </Button>
                </div>
              ))
            )}
            {errors.features && <p className='text-sm text-alert-500'>{errors.features.message as string}</p>}
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between gap-2'>
              <Label>{t('billing:classGroupAllowances')}</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  appendAllowance({
                    class_group_id: classGroups[0]?.id ?? '',
                    max_classes: '',
                  })
                }
                disabled={classGroups.length === 0}
              >
                {t('billing:addAllowance')}
              </Button>
            </div>
            <p className='text-xs text-gray-500'>{t('billing:allowancesHint')}</p>
            {allowanceFields.map((field, index) => (
              <div key={field.id} className='grid grid-cols-[1fr_120px_auto] gap-2 items-start'>
                <Select
                  value={watch(`class_group_allowances.${index}.class_group_id`) || undefined}
                  onValueChange={val =>
                    setValue(`class_group_allowances.${index}.class_group_id`, val, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('billing:selectClassGroup')} />
                  </SelectTrigger>
                  <SelectContent>
                    {classGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type='number'
                  min={1}
                  placeholder={t('billing:maxClassesOptional')}
                  {...register(`class_group_allowances.${index}.max_classes`)}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => removeAllowance(index)}
                  disabled={allowanceFields.length <= 1}
                >
                  {t('common:remove')}
                </Button>
              </div>
            ))}
            {errors.class_group_allowances && (
              <p className='text-sm text-alert-500'>{errors.class_group_allowances.message as string}</p>
            )}
          </div>

          <div className='space-y-4 rounded-lg border p-4'>
            <h3 className='text-sm font-medium'>{t('billing:landingVisibility')}</h3>

            <div className='flex items-center justify-between gap-4'>
              <div className='space-y-1'>
                <Label htmlFor='show_on_landing'>{t('billing:showOnLanding')}</Label>
                <p className='text-xs text-gray-500'>{t('billing:showOnLandingHint')}</p>
              </div>
              <Switch
                id='show_on_landing'
                checked={watch('show_on_landing')}
                onCheckedChange={checked =>
                  setValue('show_on_landing', checked, {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <div className='flex items-center justify-between gap-4'>
              <div className='space-y-1'>
                <Label htmlFor='is_recommended'>{t('billing:isRecommended')}</Label>
                <p className='text-xs text-gray-500'>{t('billing:isRecommendedHint')}</p>
              </div>
              <Switch
                id='is_recommended'
                checked={watch('is_recommended')}
                onCheckedChange={checked =>
                  setValue('is_recommended', checked, {
                    shouldValidate: true,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='recommended_order'>{t('billing:landingOrder')}</Label>
              <Input
                id='recommended_order'
                type='number'
                min={1}
                placeholder={t('billing:landingOrderPlaceholder')}
                {...register('recommended_order')}
              />
              <p className='text-xs text-gray-500'>{t('billing:landingOrderHint')}</p>
            </div>
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' disabled={isLoading || classGroups.length === 0 || taxTypes.length === 0}>
              {isLoading ? t('common:saving') : t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
