import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { SelectField } from '@components/form-fields';
import { Button, Input, Label, Textarea } from '@components/ui';
import { COUNTRY_CODE_OPTIONS, RELATIVE_OPTIONS } from '@core/constants';

const RELATIVE_SELECT_OPTIONS = RELATIVE_OPTIONS.map(option => ({
  value: option,
  label: option,
}));

export const createHealthDataSchema = (t: TFunction) =>
  z.object({
    emergencyContactName: z.string().optional(),
    emergencyContactRelative: z.string().optional(),
    emergencyContactPhoneCountryCode: z.string().optional(),
    emergencyContactPhoneNumber: z
      .string()
      .regex(/^\d{10}$/, { message: t('auth:onboarding.validationPhoneLength') })
      .optional()
      .or(z.literal('')),
    eps: z.string().optional(),
    existingMedicalConditions: z.string().optional(),
  });

export type HealthDataFormValues = z.infer<ReturnType<typeof createHealthDataSchema>>;

interface OnboardingHealthFormProps {
  isLoading: boolean;
  error: string | null;
  onContinue: (values: HealthDataFormValues) => void;
  onSkip: () => void;
}

export function OnboardingHealthForm({ isLoading, error, onContinue, onSkip }: OnboardingHealthFormProps) {
  const { t } = useTranslation();
  const schema = createHealthDataSchema(t);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<HealthDataFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      emergencyContactName: '',
      emergencyContactRelative: RELATIVE_OPTIONS[0],
      emergencyContactPhoneCountryCode: '+57',
      emergencyContactPhoneNumber: '',
      eps: '',
      existingMedicalConditions: '',
    },
  });

  return (
    <div className='space-y-6'>
      <form className='space-y-6' onSubmit={handleSubmit(onContinue)}>
        <div>
          <h2 className='text-lg font-semibold text-gray-900'>{t('auth:onboarding.healthTitle')}</h2>
          <p className='mt-1 text-sm text-gray-600'>{t('auth:onboarding.healthSubtitle')}</p>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='emergency_contact_name'>{t('auth:onboarding.emergencyContactName')}</Label>
            <Input
              id='emergency_contact_name'
              {...register('emergencyContactName')}
              placeholder={t('auth:onboarding.emergencyContactNamePlaceholder')}
            />
            {errors.emergencyContactName ? (
              <p className='text-sm text-alert-600'>{errors.emergencyContactName.message}</p>
            ) : null}
          </div>

          <SelectField
            control={control}
            name='emergencyContactRelative'
            label={t('auth:onboarding.relative')}
            options={RELATIVE_SELECT_OPTIONS}
            placeholder={t('auth:onboarding.relativePlaceholder')}
          />

          <SelectField
            control={control}
            name='emergencyContactPhoneCountryCode'
            label={t('auth:onboarding.emergencyPhoneCode')}
            options={COUNTRY_CODE_OPTIONS}
            placeholder='+57'
          />

          <div className='space-y-2'>
            <Label htmlFor='emergency_contact_phone_number'>{t('auth:onboarding.emergencyPhoneNumber')}</Label>
            <Input
              id='emergency_contact_phone_number'
              type='number'
              inputMode='numeric'
              {...register('emergencyContactPhoneNumber')}
              placeholder={t('auth:onboarding.emergencyPhoneNumberPlaceholder')}
            />
            {errors.emergencyContactPhoneNumber ? (
              <p className='text-sm text-alert-600'>{errors.emergencyContactPhoneNumber.message}</p>
            ) : null}
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='eps'>{t('auth:onboarding.eps')}</Label>
            <Input id='eps' {...register('eps')} placeholder={t('auth:onboarding.epsPlaceholder')} />
            {errors.eps ? <p className='text-sm text-alert-600'>{errors.eps.message}</p> : null}
          </div>

          <div className='space-y-2 md:col-span-2'>
            <Label htmlFor='existing_medical_conditions'>{t('auth:onboarding.medicalConditions')}</Label>
            <Textarea
              id='existing_medical_conditions'
              {...register('existingMedicalConditions')}
              placeholder={t('auth:onboarding.medicalConditionsPlaceholder')}
              className='min-h-30'
            />
          </div>
        </div>

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <div className='mt-4 flex flex-col items-center space-y-3'>
          <Button type='submit' disabled={isLoading} className='w-full'>
            {isLoading ? t('common:loading') : t('auth:onboarding.continue')}
          </Button>
          <Button type='button' onClick={onSkip} variant='ghost' disabled={isLoading} className='w-full text-gray-500'>
            {t('auth:onboarding.omitStep')}
          </Button>
        </div>
      </form>
    </div>
  );
}
