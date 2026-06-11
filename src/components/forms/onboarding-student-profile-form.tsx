import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuCalendar } from 'react-icons/lu';
import { z } from 'zod';

import { SelectField } from '@components/form-fields';
import { Button, Calendar, Input, Label, Popover, PopoverContent, PopoverTrigger } from '@components/ui';
import { COUNTRY_CODE_OPTIONS, DOCUMENT_TYPE_OPTIONS } from '@core/constants';
import { cn } from '@helpers';

export const createStudentProfileSchema = (t: TFunction) => {
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  return z.object({
    fullName: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
    birthDate: z
      .date()
      .max(tenYearsAgo, { message: t('auth:onboarding.validationMinAge10') })
      .optional()
      .or(z.literal(undefined)),
    phoneCountryCode: z.string().optional(),
    phoneNumber: z
      .string()
      .regex(/^\d{10}$/, { message: t('auth:onboarding.validationPhoneLength') })
      .optional()
      .or(z.literal('')),
    documentType: z.string().optional(),
    documentValue: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
  });
};

type StudentProfileFormValues = z.infer<ReturnType<typeof createStudentProfileSchema>>;

interface OnboardingStudentProfileFormProps {
  isLoading: boolean;
  error: string | null;
  onSubmit: (values: StudentProfileFormValues) => void;
}

export function OnboardingStudentProfileForm({ isLoading, error, onSubmit }: OnboardingStudentProfileFormProps) {
  const { t } = useTranslation();
  const schema = createStudentProfileSchema(t);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<StudentProfileFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      birthDate: undefined,
      phoneCountryCode: '+57',
      phoneNumber: '',
      documentType: 'CC',
      documentValue: '',
      city: '',
      address: '',
    },
  });

  return (
    <div className='space-y-6'>
      <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='full_name'>{t('auth:onboarding.fullName')} *</Label>
            <Input id='full_name' {...register('fullName')} placeholder={t('auth:onboarding.fullNamePlaceholder')} />
            {errors.fullName ? <p className='text-sm text-alert-600'>{errors.fullName.message}</p> : null}
          </div>

          <div className='space-y-2'>
            <Label>{t('auth:onboarding.birthDate')}</Label>
            <Controller
              control={control}
              name='birthDate'
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type='button'
                      variant='outline'
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !field.value && 'text-muted-foreground',
                      )}
                    >
                      <LuCalendar className='mr-2 h-4 w-4' />
                      {field.value ? (
                        field.value.toLocaleDateString('en-US', { dateStyle: 'medium' })
                      ) : (
                        <span>{t('auth:onboarding.pickDate')}</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      captionLayout='dropdown'
                      selected={field.value}
                      onSelect={field.onChange}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <SelectField
            control={control}
            name='documentType'
            label={t('auth:onboarding.documentType')}
            options={DOCUMENT_TYPE_OPTIONS}
            placeholder={t('auth:onboarding.selectDocType')}
          />

          <div className='space-y-2'>
            <Label htmlFor='document_value'>{t('auth:onboarding.documentValue')}</Label>
            <Input id='document_value' {...register('documentValue')} />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='phone_number'>{t('auth:onboarding.phoneNumber')}</Label>
          <div className='flex gap-2'>
            <div className='w-32.5'>
              <SelectField
                control={control}
                name='phoneCountryCode'
                label=''
                options={COUNTRY_CODE_OPTIONS}
                placeholder='+57'
              />
            </div>
            <Input id='phone_number' className='flex-1' type='tel' {...register('phoneNumber')} />
          </div>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='city'>{t('auth:onboarding.city')}</Label>
            <Input id='city' {...register('city')} />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>{t('auth:onboarding.address')}</Label>
            <Input id='address' {...register('address')} />
          </div>
        </div>

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <Button type='submit' disabled={isLoading} className='mt-4 w-full'>
          {isLoading ? t('common:loading') : t('auth:onboarding.continue')}
        </Button>
      </form>
    </div>
  );
}
