import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useForm, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Checkbox, SelectField } from '@components/form-fields';
import { Label } from '@components/ui';
import {
  DISCOVERY_OPTIONS,
  DISCIPLINES_OPTIONS,
  GOALS_OPTIONS,
  LEVEL_OPTIONS,
  SCHEDULE_OPTIONS,
} from '@core/constants';

export const createStudentPreferencesSchema = () =>
  z.object({
    heard_about_us: z.string().optional(),
    goals: z.array(z.string()),
    disciplines: z.array(z.string()),
    current_level: z.string().optional(),
    preferred_schedules: z.array(z.string()),
  });

export type StudentPreferencesFormValues = z.infer<ReturnType<typeof createStudentPreferencesSchema>>;

interface OnboardingStudentPreferencesFormProps {
  isLoading: boolean;
  error: string | null;
  onComplete: (values: StudentPreferencesFormValues) => void;
  onSkip: () => void;
}

export function OnboardingStudentPreferencesForm({
  isLoading,
  error,
  onComplete,
  onSkip,
}: OnboardingStudentPreferencesFormProps) {
  const { t } = useTranslation();
  const schema = createStudentPreferencesSchema();

  const { control, handleSubmit } = useForm<StudentPreferencesFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      heard_about_us: '',
      goals: [],
      disciplines: [],
      current_level: '',
      preferred_schedules: [],
    },
  });

  const { field: goalsField } = useController({ name: 'goals', control });
  const { field: disciplinesField } = useController({ name: 'disciplines', control });
  const { field: preferredSchedulesField } = useController({ name: 'preferred_schedules', control });

  return (
    <div className='space-y-6'>
      <form className='space-y-6' onSubmit={handleSubmit(onComplete)}>
        <div className='space-y-6'>
          <SelectField
            control={control}
            name='heard_about_us'
            label={t('auth:onboarding.fields.heardAboutUs.label')}
            options={DISCOVERY_OPTIONS.map(option => ({
              ...option,
              label: t(option.label),
            }))}
            placeholder={t('auth:onboarding.fields.heardAboutUs.placeholder')}
          />

          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
            <div className='grid gap-2 mt-4'>
              <Label>{t('auth:onboarding.goals')}</Label>
              <div className='mt-4 grid grid-cols-1 gap-4'>
                {GOALS_OPTIONS.map(({ value, label }) => (
                  <Checkbox
                    key={value}
                    id={value}
                    name={value}
                    label={t(label)}
                    checked={goalsField.value.includes(value)}
                    onChange={event => {
                      const nextValues = event.target.checked
                        ? [...goalsField.value, value]
                        : goalsField.value.filter(v => v !== value);
                      goalsField.onChange(nextValues);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className='grid gap-2 mt-4'>
              <Label>{t('auth:onboarding.disciplines')}</Label>
              <div className='mt-4 grid grid-cols-1 gap-4'>
                {DISCIPLINES_OPTIONS.map(({ value, label }) => (
                  <Checkbox
                    key={value}
                    id={value}
                    name={value}
                    label={t(label)}
                    checked={disciplinesField.value.includes(value)}
                    onChange={event => {
                      const nextValues = event.target.checked
                        ? [...disciplinesField.value, value]
                        : disciplinesField.value.filter(v => v !== value);
                      disciplinesField.onChange(nextValues);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <SelectField
            control={control}
            name='current_level'
            label={t('auth:onboarding.fields.currentLevel.label')}
            options={LEVEL_OPTIONS.map(option => ({
              ...option,
              label: t(option.label),
            }))}
            placeholder={t('auth:onboarding.fields.currentLevel.placeholder')}
          />

          <div className='grid gap-2 mt-4'>
            <Label>{t('auth:onboarding.preferredSchedules')}</Label>
            <div className='mt-4 grid grid-cols-1 gap-4'>
              {SCHEDULE_OPTIONS.map(({ value, label }) => (
                <Checkbox
                  key={value}
                  id={value}
                  name={value}
                  label={t(label)}
                  checked={preferredSchedulesField.value.includes(value)}
                  onChange={event => {
                    const nextValues = event.target.checked
                      ? [...preferredSchedulesField.value, value]
                      : preferredSchedulesField.value.filter(v => v !== value);
                    preferredSchedulesField.onChange(nextValues);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <div className='mt-6 flex flex-col items-center space-y-3'>
          <Button type='submit' isLoading={isLoading} color='primary' fullWidth>
            {isLoading ? t('common:loading') : t('auth:onboarding.complete')}
          </Button>
          <Button type='button' onClick={onSkip} color='tertiary' variant='text' isLoading={isLoading} fullWidth>
            {t('auth:onboarding.omitStep')}
          </Button>
        </div>
      </form>
    </div>
  );
}
