import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuTrash2, LuPlus } from 'react-icons/lu';
import { toast } from 'sonner';
import { z } from 'zod';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from '@components/ui';
import { DansshipAPI, UpdateAvailabilityPayload } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

// Helpers to get current week Monday string
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  return new Date(date.setDate(diff)).toISOString().split('T')[0];
};

const getNextMonday = (mondayStr: string) => {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() + 7);

  return d.toISOString().split('T')[0];
};

const getPrevMonday = (mondayStr: string) => {
  const d = new Date(mondayStr);
  d.setDate(d.getDate() - 7);

  return d.toISOString().split('T')[0];
};

const DAYS_OF_WEEK = [
  { value: 0, labelKey: 'common:days.monday' },
  { value: 1, labelKey: 'common:days.tuesday' },
  { value: 2, labelKey: 'common:days.wednesday' },
  { value: 3, labelKey: 'common:days.thursday' },
  { value: 4, labelKey: 'common:days.friday' },
  { value: 5, labelKey: 'common:days.saturday' },
  { value: 6, labelKey: 'common:days.sunday' },
];

const slotSchema = z
  .object({
    day_of_week: z.coerce.number().min(0).max(6),
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM required'),
    end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM required'),
  })
  .refine(
    data => {
      return data.start_time < data.end_time;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    },
  );

const availabilitySchema = z.object({
  slots: z.array(slotSchema),
});

type AvailabilityFormValues = z.infer<typeof availabilitySchema>;

export function AvailabilityForm() {
  const { t, i18n } = useTranslation();
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const { response: availability, isLoading } = usePromise(() => DansshipAPI.instructors.getAvailability(currentWeek));

  const { call: updateAvailabilityPromise, isLoading: isSaving } = useCallablePromise(
    (payload: UpdateAvailabilityPayload) => DansshipAPI.instructors.updateAvailability(payload),
  );

  const updateAvailability = useCallback(
    async (payload: UpdateAvailabilityPayload) => {
      const { ok } = await updateAvailabilityPromise(payload);

      if (ok) {
        toast.success(t('instructor:availability.updateSuccess'));
      } else {
        toast.error(t('instructor:availability.updateFailed'));
      }
    },
    [t, updateAvailabilityPromise],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AvailabilityFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      slots: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'slots',
  });

  useEffect(() => {
    if (availability?.ok) {
      reset({
        slots: availability.data.slots.map(s => ({
          day_of_week: s.day_of_week,
          // Strip seconds if backend returns HH:MM:SS
          start_time: s.start_time.slice(0, 5),
          end_time: s.end_time.slice(0, 5),
        })),
      });
    } else {
      reset({ slots: [] });
    }
  }, [availability, reset, currentWeek]);

  const onSubmit = async (data: AvailabilityFormValues) => {
    // Re-append :00 for seconds to match standard backend time formats if needed, or rely on backend parsing HH:MM
    const formattedSlots = data.slots.map(s => ({
      ...s,
      start_time: s.start_time.length === 5 ? `${s.start_time}:00` : s.start_time,
      end_time: s.end_time.length === 5 ? `${s.end_time}:00` : s.end_time,
    }));

    await updateAvailability({
      week_start_date: currentWeek,
      slots: formattedSlots,
    });

    // Reset dirty state
    reset(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('instructor:availability.title')}</CardTitle>

        <CardDescription>{t('instructor:availability.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        {/* Week Selector */}
        <div className='mb-6 flex items-center space-x-4'>
          <Button variant='outline' onClick={() => setCurrentWeek(getPrevMonday(currentWeek))}>
            {t('instructor:availability.previousWeek')}
          </Button>

          <div className='text-lg font-semibold'>Week of {new Date(currentWeek).toLocaleDateString(i18n.language)}</div>

          <Button variant='outline' onClick={() => setCurrentWeek(getNextMonday(currentWeek))}>
            {t('instructor:availability.nextWeek')}
          </Button>
        </div>

        {isLoading ? (
          <div className='flex justify-center p-8'>
            <SpinnerLoader />
          </div>
        ) : (
          <>
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/* @ts-ignore */}
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {fields.length === 0 ? (
                <div className='rounded-md border-2 border-dashed py-8 text-center text-gray-500'>
                  {t('instructor:availability.noSlots')}
                </div>
              ) : (
                <div className='space-y-4'>
                  {fields.map((field, index) => (
                    <div key={field.id} className='flex items-start space-x-4 rounded-md border bg-gray-50/50 p-4'>
                      <div className='w-1/3 space-y-2'>
                        <Label>{t('instructor:availability.day')}</Label>

                        <Select
                          defaultValue={field.day_of_week.toString()}
                          onValueChange={val =>
                            setValue(`slots.${index}.day_of_week`, parseInt(val, 10), { shouldDirty: true })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('instructor.availability.selectDay')} />
                          </SelectTrigger>

                          <SelectContent>
                            {DAYS_OF_WEEK.map(d => (
                              <SelectItem key={d.value} value={d.value.toString()}>
                                {t(d.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='w-1/4 space-y-2'>
                        <Label>{t('instructor:availability.startTime')}</Label>

                        <Input type='time' {...register(`slots.${index}.start_time`)} />

                        {errors?.slots?.[index]?.start_time && (
                          <p className='text-xs text-alert-500'>{errors.slots[index]?.start_time?.message}</p>
                        )}
                      </div>

                      <div className='w-1/4 space-y-2'>
                        <Label>{t('instructor:availability.endTime')}</Label>

                        <Input type='time' {...register(`slots.${index}.end_time`)} />

                        {errors?.slots?.[index]?.end_time && (
                          <p className='text-xs text-alert-500'>{errors.slots[index]?.end_time?.message}</p>
                        )}
                      </div>

                      <div className='pt-8'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          className='text-alert-500 hover:bg-red-50 hover:text-alert-700'
                          onClick={() => remove(index)}
                        >
                          <LuTrash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className='flex items-center justify-between pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    append({
                      day_of_week: 0,
                      start_time: '09:00',
                      end_time: '10:00',
                    })
                  }
                >
                  <LuPlus className='mr-2 h-4 w-4' />
                  {t('instructor:availability.addSlot')}
                </Button>

                <Button type='submit' disabled={isSaving || !isDirty}>
                  {isSaving ? t('common:saving') : t('instructor:availability.save')}
                </Button>
              </div>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
