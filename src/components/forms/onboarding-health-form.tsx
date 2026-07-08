import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { SelectField, TextareaField, TextField } from '@components/form-fields';
import { COUNTRY_CODE_OPTIONS, RELATIVE_OPTIONS } from '@core/constants';

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

  const { handleSubmit, control } = useForm<HealthDataFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      emergencyContactName: '',
      emergencyContactRelative: '',
      emergencyContactPhoneCountryCode: '+57',
      emergencyContactPhoneNumber: '',
      eps: '',
      existingMedicalConditions: '',
    },
  });

  return (
    <div className='space-y-6'>
      <form className='space-y-6' onSubmit={handleSubmit(onContinue)}>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
          <TextField
            control={control}
            name='emergencyContactName'
            label={t('auth:onboarding.fields.emergencyContactName.label')}
            placeholder={t('auth:onboarding.fields.emergencyContactName.placeholder')}
          />

          <SelectField
            control={control}
            name='emergencyContactRelative'
            label={t('auth:onboarding.fields.relative.label')}
            options={RELATIVE_OPTIONS.map(option => ({
              ...option,
              label: t(option.label),
            }))}
            placeholder={t('auth:onboarding.fields.relative.placeholder')}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-[auto_1fr] items-start'>
          <SelectField
            control={control}
            name='emergencyContactPhoneCountryCode'
            label={t('auth:onboarding.fields.emergencyPhoneCode.label')}
            options={COUNTRY_CODE_OPTIONS}
            placeholder={t('auth:onboarding.fields.emergencyPhoneCode.placeholder')}
          />

          <TextField
            type='number'
            inputMode='numeric'
            control={control}
            name='emergencyContactPhoneNumber'
            label={t('auth:onboarding.fields.emergencyPhoneNumber.label')}
            placeholder={t('auth:onboarding.fields.emergencyPhoneNumber.placeholder')}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
          <TextField
            control={control}
            name='eps'
            label={t('auth:onboarding.fields.eps.label')}
            placeholder={t('auth:onboarding.fields.eps.placeholder')}
          />

          <TextareaField
            control={control}
            name='existingMedicalConditions'
            label={t('auth:onboarding.fields.medicalConditions.label')}
            placeholder={t('auth:onboarding.fields.medicalConditions.placeholder')}
          />
        </div>

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <div className='mt-4 flex flex-col items-center space-y-3'>
          <Button type='submit' isLoading={isLoading} color='primary' fullWidth>
            {isLoading ? t('common:loading') : t('auth:onboarding.continue')}
          </Button>
          <Button type='button' onClick={onSkip} variant='text' color='tertiary' isLoading={isLoading} fullWidth>
            {t('auth:onboarding.omitStep')}
          </Button>
        </div>
      </form>
    </div>
  );
}
