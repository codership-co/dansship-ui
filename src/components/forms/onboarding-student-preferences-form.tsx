import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useController } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { SelectField } from '@components/form-fields';
import { Button, Label } from '@components/ui';
import {
  DISCOVERY_OPTIONS,
  DISCIPLINES_OPTIONS,
  GOALS_OPTIONS,
  LEVEL_OPTIONS,
  SCHEDULE_OPTIONS,
} from '@core/constants';

const DISCOVERY_SELECT_OPTIONS = DISCOVERY_OPTIONS.map(option => ({
  value: option,
  label: option,
}));

const LEVEL_SELECT_OPTIONS = LEVEL_OPTIONS.map(option => ({
  value: option,
  label: option,
}));

export const createStudentPreferencesSchema = () =>
  z.object({
    heardAboutUs: z.string().optional(),
    goals: z.array(z.string()),
    disciplines: z.array(z.string()),
    currentLevel: z.string().optional(),
    preferredSchedules: z.array(z.string()),
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
      heardAboutUs: '',
      goals: [],
      disciplines: [],
      currentLevel: '',
      preferredSchedules: [],
    },
  });

  const { field: goalsField } = useController({ name: 'goals', control });
  const { field: disciplinesField } = useController({ name: 'disciplines', control });
  const { field: preferredSchedulesField } = useController({ name: 'preferredSchedules', control });

  return (
    <div className='space-y-6'>
      <form className='space-y-6' onSubmit={handleSubmit(onComplete)}>
        <div>
          <h2 className='text-lg font-semibold text-gray-900'>{t('auth:onboarding.preferencesTitle')}</h2>
          <p className='mt-1 text-sm text-gray-600'>{t('auth:onboarding.preferencesSubtitle')}</p>
        </div>

        <div className='space-y-6'>
          <SelectField
            control={control}
            name='heardAboutUs'
            label={t('auth:onboarding.heardAboutUs')}
            options={DISCOVERY_SELECT_OPTIONS}
            placeholder={t('auth:onboarding.selectOption')}
          />

          <div className='space-y-2'>
            <Label>{t('auth:onboarding.goals')}</Label>
            <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {GOALS_OPTIONS.map(option => (
                <label
                  key={option}
                  className='flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50'
                >
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                    checked={goalsField.value.includes(option)}
                    onChange={event => {
                      const nextValues = event.target.checked
                        ? [...goalsField.value, option]
                        : goalsField.value.filter(value => value !== option);
                      goalsField.onChange(nextValues);
                    }}
                  />
                  <span className='text-sm'>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className='space-y-2'>
            <Label>{t('auth:onboarding.disciplines')}</Label>
            <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {DISCIPLINES_OPTIONS.map(option => (
                <label
                  key={option}
                  className='flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50'
                >
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                    checked={disciplinesField.value.includes(option)}
                    onChange={event => {
                      const nextValues = event.target.checked
                        ? [...disciplinesField.value, option]
                        : disciplinesField.value.filter(value => value !== option);
                      disciplinesField.onChange(nextValues);
                    }}
                  />
                  <span className='text-sm'>{option}</span>
                </label>
              ))}
            </div>
          </div>

          <SelectField
            control={control}
            name='currentLevel'
            label={t('auth:onboarding.currentLevel')}
            options={LEVEL_SELECT_OPTIONS}
            placeholder={t('auth:onboarding.selectOption')}
          />

          <div className='space-y-2'>
            <Label>{t('auth:onboarding.preferredSchedules')}</Label>
            <div className='mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {SCHEDULE_OPTIONS.map(option => (
                <label
                  key={option}
                  className='flex cursor-pointer items-center space-x-2 rounded-md border p-2 hover:bg-gray-50'
                >
                  <input
                    type='checkbox'
                    className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                    checked={preferredSchedulesField.value.includes(option)}
                    onChange={event => {
                      const nextValues = event.target.checked
                        ? [...preferredSchedulesField.value, option]
                        : preferredSchedulesField.value.filter(value => value !== option);
                      preferredSchedulesField.onChange(nextValues);
                    }}
                  />
                  <span className='text-sm'>{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <div className='mt-6 flex flex-col items-center space-y-3'>
          <Button type='submit' disabled={isLoading} className='w-full'>
            {isLoading ? t('common:loading') : t('auth:onboarding.complete')}
          </Button>
          <Button type='button' onClick={onSkip} variant='ghost' disabled={isLoading} className='w-full text-gray-500'>
            {t('auth:onboarding.omitStep')}
          </Button>
        </div>
      </form>
    </div>
  );
}
