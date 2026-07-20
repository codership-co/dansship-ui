import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuPhone } from 'react-icons/lu';
import { z } from 'zod';

import { PhoneField, SelectField, TextareaField, TextField } from '@components/form-fields';
import { RELATIVE_OPTIONS } from '@core/constants';

export const createHealthDataSchema = (t: TFunction) =>
  z.object({
    emergency_contact_name: z.string().optional(),
    emergency_contact_relative: z.string().optional(),
    emergency_contact_phone_country_code: z.string().optional(),
    emergency_contact_phone_number: z
      .string()
      .regex(/^\d{10}$/, { message: t('auth:onboarding.validationPhoneLength') })
      .optional()
      .or(z.literal('')),
    eps: z.string().optional(),
    existing_medical_conditions: z.string().optional(),
  });

export type HealthDataFormValues = z.infer<ReturnType<typeof createHealthDataSchema>>;

interface HealthProfileFormProps {
  isLoading: boolean;
  error: string | null;
  onContinue: (values: HealthDataFormValues) => void;
  onSkip: () => void;
}

export function HealthProfileForm({ isLoading, error, onContinue, onSkip }: HealthProfileFormProps) {
  const { t } = useTranslation();
  const schema = createHealthDataSchema(t);

  const { handleSubmit, control } = useForm<HealthDataFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      emergency_contact_name: '',
      emergency_contact_relative: '',
      emergency_contact_phone_country_code: '+57',
      emergency_contact_phone_number: '',
      eps: '',
      existing_medical_conditions: '',
    },
  });

  return (
    <div className='space-y-6'>
      <form className='space-y-6' onSubmit={handleSubmit(onContinue)}>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-end'>
          <TextField
            control={control}
            name='emergency_contact_name'
            label={t('auth:onboarding.fields.emergencyContactName.label')}
            placeholder={t('auth:onboarding.fields.emergencyContactName.placeholder')}
          />

          <SelectField
            control={control}
            name='emergency_contact_relative'
            label={t('auth:onboarding.fields.relative.label')}
            options={RELATIVE_OPTIONS.map(option => ({
              ...option,
              label: t(option.label),
            }))}
            placeholder={t('auth:onboarding.fields.relative.placeholder')}
          />
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-end'>
          <PhoneField
            control={control}
            codeName='emergency_contact_phone_country_code'
            codePlaceholder={t('auth:onboarding.fields.emergencyPhoneCode.placeholder')}
            name='emergency_contact_phone_number'
            icon={<LuPhone className='mr-2 h-4 w-4' />}
            type='tel'
            label={t('auth:onboarding.fields.emergencyPhoneNumber.label')}
            placeholder={t('auth:onboarding.fields.emergencyPhoneNumber.placeholder')}
          />
          <TextField
            control={control}
            name='eps'
            label={t('auth:onboarding.fields.eps.label')}
            placeholder={t('auth:onboarding.fields.eps.placeholder')}
          />
        </div>

        <TextareaField
          control={control}
          rows={8}
          name='existing_medical_conditions'
          label={t('auth:onboarding.fields.medicalConditions.label')}
          placeholder={t('auth:onboarding.fields.medicalConditions.placeholder')}
        />

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
