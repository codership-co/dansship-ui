import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { Resolver, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { z } from 'zod';

import { SelectField, TextField } from '@components/form-fields';
import { Label } from '@components/ui';
import { DaysOfWeek, OnboardingAvailabilitySlot } from '@core/api';
import { DAY_OF_WEEK_OPTIONS } from '@core/constants';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createOperationalProfileSchema = (t: TFunction) => {
  const slotSchema = z
    .object({
      day_of_week: z.string().min(1, { message: t('auth:onboarding.validationRequired') }),
      start_time: z.string().regex(TIME_REGEX, { message: t('auth:onboarding.validationTimeFormat') }),
      end_time: z.string().regex(TIME_REGEX, { message: t('auth:onboarding.validationTimeFormat') }),
    })
    .refine(data => data.start_time < data.end_time, {
      message: t('auth:onboarding.validationEndAfterStart'),
      path: ['end_time'],
    });

  return z.object({
    instagram: z
      .string()
      .min(1, { message: t('auth:onboarding.validationRequired') })
      .max(255),
    availability: z
      .array(slotSchema)
      .min(1, { message: t('auth:onboarding.validationMinAvailability') })
      .superRefine((slots, ctx) => {
        const seen = new Set<string>();

        slots.forEach((slot, index) => {
          const key = `${slot.day_of_week}|${slot.start_time}`;

          if (seen.has(key)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: t('auth:onboarding.validationDuplicateAvailability'),
              path: [index, 'start_time'],
            });

            return;
          }

          seen.add(key);
        });
      }),
    disciplines: z
      .array(
        z.object({
          discipline_name: z
            .string()
            .min(1, { message: t('auth:onboarding.validationRequired') })
            .max(255),
          years_experience: z.coerce.number().gt(0, { message: t('auth:onboarding.validationYearsExperience') }),
        }),
      )
      .min(1, { message: t('auth:onboarding.validationMinDisciplines') }),
  });
};

export type OperationalProfileFormValues = z.infer<ReturnType<typeof createOperationalProfileSchema>>;

interface OnboardingOperationalProfileFormProps {
  isLoading: boolean;
  error: string | null;
  defaultValues?: {
    instagram?: string | null;
    availability?: Array<OnboardingAvailabilitySlot>;
    disciplines?: OperationalProfileFormValues['disciplines'];
  } | null;
  onSubmit: (values: {
    instagram: string;
    availability: Array<OnboardingAvailabilitySlot>;
    disciplines: OperationalProfileFormValues['disciplines'];
  }) => void;
}

const toApiTime = (value: string) => (value.length === 5 ? `${value}:00` : value);
const fromApiTime = (value: string) => value.slice(0, 5);

export function OperationalProfileForm({
  isLoading,
  error,
  defaultValues,
  onSubmit,
}: OnboardingOperationalProfileFormProps) {
  const { t } = useTranslation();
  const schema = createOperationalProfileSchema(t);

  const { control, handleSubmit } = useForm<OperationalProfileFormValues>({
    resolver: zodResolver(schema) as Resolver<OperationalProfileFormValues>,
    defaultValues: {
      instagram: defaultValues?.instagram ?? '',
      availability: defaultValues?.availability?.map(slot => ({
        day_of_week: slot.day_of_week,
        start_time: fromApiTime(slot.start_time),
        end_time: fromApiTime(slot.end_time),
      })) ?? [{ day_of_week: 'monday', start_time: '09:00', end_time: '12:00' }],
      disciplines: defaultValues?.disciplines ?? [{ discipline_name: '', years_experience: 1 }],
    },
  });

  const {
    fields: availabilityFields,
    append: appendAvailability,
    remove: removeAvailability,
  } = useFieldArray({ control, name: 'availability' });

  const {
    fields: disciplineFields,
    append: appendDiscipline,
    remove: removeDiscipline,
  } = useFieldArray({ control, name: 'disciplines' });

  const handleFormSubmit = (values: OperationalProfileFormValues) => {
    onSubmit({
      instagram: values.instagram.trim(),
      availability: values.availability.map(slot => ({
        day_of_week: slot.day_of_week as DaysOfWeek,
        start_time: toApiTime(slot.start_time),
        end_time: toApiTime(slot.end_time),
      })),
      disciplines: values.disciplines,
    });
  };

  return (
    <div className='grid gap-4'>
      <form className='grid gap-16' onSubmit={handleSubmit(handleFormSubmit)}>
        <TextField
          control={control}
          name='instagram'
          label={t('auth:onboarding.fields.instagram.label')}
          placeholder={t('auth:onboarding.fields.instagram.placeholder')}
        />

        <section className='grid gap-4'>
          <section className='grid grid-flow-col items-start gap-8 justify-between'>
            <p className='font-bold'>{t('auth:onboarding.availability')}</p>

            <Button
              size='small'
              type='button'
              color='primary'
              variant='outlined'
              onClick={() => appendAvailability({ day_of_week: 'monday', start_time: '09:00', end_time: '12:00' })}
            >
              <LuPlus />
              {t('auth:onboarding.addAvailability')}
            </Button>
          </section>

          {availabilityFields.map((field, index) => (
            <div key={field.id} className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] items-start'>
              <div className='grid gap-2'>
                <div className='flex items-center justify-between gap-2'>
                  <Label htmlFor={`availability.${index}.day_of_week`}>
                    {t('auth:onboarding.fields.dayOfWeek.label')}
                  </Label>
                  <Button
                    type='button'
                    color='tertiary'
                    variant='text'
                    className='lg:hidden -mr-2'
                    disabled={availabilityFields.length === 1}
                    onClick={() => removeAvailability(index)}
                  >
                    <LuTrash2 />
                  </Button>
                </div>
                <SelectField
                  control={control}
                  name={`availability.${index}.day_of_week`}
                  label={t('auth:onboarding.fields.dayOfWeek.label')}
                  hideLabel
                  options={DAY_OF_WEEK_OPTIONS.map(option => ({
                    value: option.value,
                    label: t(option.label),
                  }))}
                  placeholder={t('auth:onboarding.fields.dayOfWeek.placeholder')}
                />
              </div>
              <div className='grid grid-cols-2 gap-4 lg:contents'>
                <TextField
                  control={control}
                  name={`availability.${index}.start_time`}
                  type='time'
                  label={t('auth:onboarding.fields.startTime.label')}
                />
                <TextField
                  control={control}
                  name={`availability.${index}.end_time`}
                  type='time'
                  label={t('auth:onboarding.fields.endTime.label')}
                />
              </div>
              <Button
                type='button'
                color='tertiary'
                variant='text'
                className='hidden lg:inline-flex mt-8'
                disabled={availabilityFields.length === 1}
                onClick={() => removeAvailability(index)}
              >
                <LuTrash2 />
              </Button>
            </div>
          ))}
        </section>

        <section className='grid gap-4'>
          <section className='grid grid-flow-col items-start gap-8 justify-between'>
            <p className='font-bold'>{t('auth:onboarding.instructorDisciplines')}</p>

            <Button
              size='small'
              type='button'
              color='primary'
              variant='outlined'
              onClick={() => appendDiscipline({ discipline_name: '', years_experience: 1 })}
            >
              <LuPlus />
              {t('auth:onboarding.addDiscipline')}
            </Button>
          </section>

          {disciplineFields.map((field, index) => (
            <div key={field.id} className='grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto] items-start'>
              <div className='grid gap-2'>
                <div className='flex items-center justify-between gap-2'>
                  <Label htmlFor={`field-disciplines.${index}.discipline_name`}>
                    {t('auth:onboarding.fields.disciplineName.label')}
                  </Label>
                  <Button
                    type='button'
                    color='tertiary'
                    variant='text'
                    className='lg:hidden -mr-2'
                    disabled={disciplineFields.length === 1}
                    onClick={() => removeDiscipline(index)}
                  >
                    <LuTrash2 />
                  </Button>
                </div>
                <TextField
                  control={control}
                  name={`disciplines.${index}.discipline_name`}
                  label={t('auth:onboarding.fields.disciplineName.label')}
                  hideLabel
                  placeholder={t('auth:onboarding.fields.disciplineName.placeholder')}
                />
              </div>
              <TextField
                control={control}
                name={`disciplines.${index}.years_experience`}
                type='number'
                inputMode='decimal'
                label={t('auth:onboarding.fields.yearsExperience.label')}
                placeholder={t('auth:onboarding.fields.yearsExperience.placeholder')}
              />
              <Button
                type='button'
                color='tertiary'
                variant='text'
                className='hidden lg:inline-flex mt-8'
                disabled={disciplineFields.length === 1}
                onClick={() => removeDiscipline(index)}
              >
                <LuTrash2 />
              </Button>
            </div>
          ))}
        </section>

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <Button type='submit' isLoading={isLoading} color='primary' className='mt-20' fullWidth>
          {t('auth:onboarding.continue')}
        </Button>
      </form>
    </div>
  );
}
