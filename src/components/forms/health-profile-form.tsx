import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button, Checkbox } from 'polpo/components';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuPhone } from 'react-icons/lu';
import { z } from 'zod';

import { PhoneField, SelectField, TextareaField, TextField } from '@components/form-fields';
import { RELATIVE_OPTIONS } from '@core/constants';

export const createHealthDataSchema = (t: TFunction, requireHealth = false) => {
  const fields = z.object({
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
    no_medical_conditions: z.boolean().optional(),
  });

  if (!requireHealth) {
    return fields;
  }

  return fields.superRefine((values, context) => {
    if (!values.emergency_contact_name?.trim()) {
      context.addIssue({
        code: 'custom',
        path: ['emergency_contact_name'],
        message: t('auth:onboarding.validationRequired'),
      });
    }

    if (!/^\d{10}$/.test(values.emergency_contact_phone_number ?? '')) {
      context.addIssue({
        code: 'custom',
        path: ['emergency_contact_phone_number'],
        message: t('auth:onboarding.validationPhoneLength'),
      });
    }

    const hasConditions = Boolean(values.existing_medical_conditions?.trim());

    if (!values.no_medical_conditions && !hasConditions) {
      context.addIssue({
        code: 'custom',
        path: ['existing_medical_conditions'],
        message: t('family:healthRequired'),
      });
    }
  });
};

export type HealthDataFormValues = z.infer<ReturnType<typeof createHealthDataSchema>>;

interface HealthProfileFormProps {
  isLoading: boolean;
  error: string | null;
  onContinue: (values: HealthDataFormValues) => void;
  onSkip?: () => void;
  defaultValues?: HealthDataFormValues;
  submitLabel?: string;
  showSkip?: boolean;
  requireHealth?: boolean;
  guardianContact?: { name: string; phoneCountryCode?: string; phoneNumber?: string };
}

export function HealthProfileForm({
  isLoading,
  error,
  onContinue,
  onSkip,
  defaultValues,
  submitLabel,
  showSkip = true,
  requireHealth = false,
  guardianContact,
}: HealthProfileFormProps) {
  const { t } = useTranslation();
  const schema = createHealthDataSchema(t, requireHealth);

  const { handleSubmit, control, setValue, watch } = useForm<HealthDataFormValues>({
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
      no_medical_conditions: false,
      ...defaultValues,
    },
  });
  const noConditions = watch('no_medical_conditions');

  return (
    <div className='space-y-6' data-sentry-mask>
      <form className='space-y-6' onSubmit={handleSubmit(onContinue)}>
        {guardianContact ? (
          <Button
            type='button'
            variant='outlined'
            color='secondary'
            onClick={() => {
              setValue('emergency_contact_name', guardianContact.name);
              setValue('emergency_contact_phone_country_code', guardianContact.phoneCountryCode || '+57');
              setValue('emergency_contact_phone_number', guardianContact.phoneNumber || '');
            }}
          >
            {t('family:useMyContact')}
          </Button>
        ) : null}
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

        {requireHealth ? (
          <Checkbox
            label={t('family:noConditions')}
            name='no_medical_conditions'
            value={Boolean(noConditions)}
            setValue={() => {
              const next = !noConditions;

              setValue('no_medical_conditions', next);

              if (next) {
                setValue('existing_medical_conditions', '');
              }
            }}
          />
        ) : null}

        <TextareaField
          control={control}
          rows={8}
          name='existing_medical_conditions'
          label={t('auth:onboarding.fields.medicalConditions.label')}
          placeholder={t('auth:onboarding.fields.medicalConditions.placeholder')}
          disabled={Boolean(noConditions)}
        />

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <div className='mt-4 flex flex-col items-center space-y-3'>
          <Button type='submit' isLoading={isLoading} color='primary' fullWidth>
            {isLoading ? t('common:loading') : (submitLabel ?? t('auth:onboarding.continue'))}
          </Button>
          {showSkip && onSkip ? (
            <Button type='button' onClick={onSkip} variant='text' color='tertiary' isLoading={isLoading} fullWidth>
              {t('auth:onboarding.omitStep')}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
