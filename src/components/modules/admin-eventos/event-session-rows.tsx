import { Button } from 'polpo/components';
import { useState } from 'react';
import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuCalendar, LuPlus, LuX } from 'react-icons/lu';
import { toast } from 'sonner';

import { EditorField, EditorSelect } from './editor-field';
import { WEEKDAY_KEYS } from './event-sessions-panel';

import { Input } from '@components/ui';

import type { EventInfoValues } from './event-info-form';

export const EXTERNAL_PLACE = 'external';
export const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** One row of "Fechas y lugar" before the event exists: Bogotá date and clock, a room or an external place. */
export interface SessionDraft {
  date: string;
  start: string;
  end: string;
  place: string;
  external_location: string;
}

/** "Repetir cada semana": `weekday` indexes `WEEKDAY_KEYS` (0 = Monday). */
export interface RepeatDraft {
  weekday: string;
  start: string;
  end: string;
  from: string;
  to: string;
  place: string;
}

export const emptyRepeat = (place: string): RepeatDraft => ({
  weekday: '5',
  start: '19:00',
  end: '21:00',
  from: '',
  to: '',
  place,
});

/** Calendar dates (YYYY-MM-DD) between `from` and `to`, both included, that fall on `weekday` (0 = Monday). */
export function weeklyDates(from: string, to: string, weekday: number): Array<string> {
  const target = (weekday + 1) % 7;
  const dates: Array<string> = [];
  const last = new Date(`${to}T12:00:00Z`);

  for (let day = new Date(`${from}T12:00:00Z`); day <= last; day.setUTCDate(day.getUTCDate() + 1)) {
    if (day.getUTCDay() === target) dates.push(day.toISOString().slice(0, 10));
  }

  return dates;
}

/** Earliest first; the first row becomes the event's main session. */
export const sortSessions = (rows: Array<SessionDraft>) =>
  [...rows].sort((a, b) => `${a.date}T${a.start}`.localeCompare(`${b.date}T${b.start}`));

interface EventSessionRowsProps {
  form: UseFormReturn<EventInfoValues>;
  rooms: Array<{ id: string; name: string }>;
  disabled: boolean;
}

/** Sessions of an event still being created: rows saved with the event, "Agregar sesión" and "Repetir cada semana". */
export function EventSessionRows({ form, rooms, disabled }: EventSessionRowsProps) {
  const { t } = useTranslation();
  const { control, register, getValues, formState } = form;
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'sessions' });
  const sessions = useWatch({ control, name: 'sessions' });
  const [repeating, setRepeating] = useState(false);
  const errors = formState.errors.sessions;
  const roomOptions = rooms.map(room => ({ value: room.id, label: room.name }));
  const placeOptions = [...roomOptions, { value: EXTERNAL_PLACE, label: t('eventos:info.externalPlace') }];
  const weekdays = WEEKDAY_KEYS.map((day, index) => ({ value: String(index), label: t(`common:days.${day}`) }));

  const addRow = () => {
    const last = getValues('sessions').at(-1);

    append({
      date: '',
      start: last?.start ?? '19:00',
      end: last?.end ?? '21:00',
      place: last?.place ?? '',
      external_location: last?.external_location ?? '',
    });
  };

  const applyRepeat = () => {
    const repeat = getValues('repeat');
    const day = (weekdays[Number(repeat.weekday)]?.label ?? '').toLowerCase();

    if (!repeat.from || !repeat.to) {
      toast.error(t('eventos:info.repeat.datesRequired'));

      return;
    }

    if (!TIME_REGEX.test(repeat.start) || !TIME_REGEX.test(repeat.end) || repeat.end <= repeat.start) {
      toast.error(t('eventos:info.errors.endAfterStart'));

      return;
    }

    if (!repeat.place) {
      toast.error(t('eventos:info.errors.place'));

      return;
    }

    const dates = weeklyDates(repeat.from, repeat.to, Number(repeat.weekday));

    if (dates.length === 0) {
      toast.error(t('eventos:info.repeat.none', { day }));

      return;
    }

    const kept = getValues('sessions').filter(row => row.date);
    const generated = dates.map(date => ({
      date,
      start: repeat.start,
      end: repeat.end,
      place: repeat.place,
      external_location: '',
    }));

    replace(sortSessions([...kept, ...generated]));
    setRepeating(false);
    toast.success(t('eventos:info.repeat.added', { count: dates.length, day }));
  };

  return (
    <div className='grid gap-4'>
      <div className='grid gap-3'>
        {fields.map((row, index) => {
          // Labels show once above the rows on desktop (like a table header); they stay for screen readers.
          const labelClass = index > 0 ? 'md:[&>div:first-child]:sr-only' : undefined;

          return (
            <div
              key={row.id}
              className='grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1.2fr_1fr_1fr_1.4fr_auto] md:items-start md:border-0 md:p-0'
            >
              <EditorField
                label={t('eventos:info.date')}
                required
                htmlFor={`session-${index}-date`}
                error={errors?.[index]?.date?.message}
                className={labelClass}
              >
                <Input
                  id={`session-${index}-date`}
                  type='date'
                  disabled={disabled}
                  {...register(`sessions.${index}.date`)}
                />
              </EditorField>
              <EditorField
                label={t('eventos:info.start')}
                required
                htmlFor={`session-${index}-start`}
                error={errors?.[index]?.start?.message}
                className={labelClass}
              >
                <Input
                  id={`session-${index}-start`}
                  type='time'
                  disabled={disabled}
                  {...register(`sessions.${index}.start`)}
                />
              </EditorField>
              <EditorField
                label={t('eventos:info.end')}
                required
                htmlFor={`session-${index}-end`}
                error={errors?.[index]?.end?.message}
                className={labelClass}
              >
                <Input
                  id={`session-${index}-end`}
                  type='time'
                  disabled={disabled}
                  {...register(`sessions.${index}.end`)}
                />
              </EditorField>
              <div className='grid gap-2'>
                <EditorSelect
                  control={control}
                  name={`sessions.${index}.place`}
                  label={t('eventos:info.place')}
                  required
                  disabled={disabled}
                  options={placeOptions}
                  className={labelClass}
                />
                {sessions?.[index]?.place === EXTERNAL_PLACE ? (
                  <EditorField
                    label={t('eventos:info.externalLocation')}
                    htmlFor={`session-${index}-external`}
                    error={errors?.[index]?.external_location?.message}
                    className='[&>div:first-child]:sr-only'
                  >
                    <Input
                      id={`session-${index}-external`}
                      maxLength={200}
                      placeholder={t('eventos:info.externalLocation')}
                      disabled={disabled}
                      {...register(`sessions.${index}.external_location`)}
                    />
                  </EditorField>
                ) : null}
              </div>
              <Button
                type='button'
                variant='text'
                color='primary'
                size='small'
                className={index === 0 ? 'min-h-11 md:mt-7' : 'min-h-11'}
                aria-label={t('eventos:info.removeSession')}
                disabled={disabled || fields.length === 1}
                onClick={() => remove(index)}
              >
                <LuX className='size-4' aria-hidden />
              </Button>
            </div>
          );
        })}
      </div>

      <div className='flex flex-wrap gap-2'>
        <Button type='button' variant='outlined' color='primary' size='small' disabled={disabled} onClick={addRow}>
          <LuPlus className='size-4' aria-hidden />
          {t('eventos:info.addSession')}
        </Button>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          size='small'
          disabled={disabled}
          aria-expanded={repeating}
          onClick={() => setRepeating(current => !current)}
        >
          <LuCalendar className='size-4' aria-hidden />
          {t('eventos:info.repeat.title')}
        </Button>
      </div>

      {repeating ? (
        <div className='grid gap-3 rounded-xl bg-secondary p-3.5'>
          <p className='m-0 text-sm font-semibold'>{t('eventos:info.repeat.title')}</p>
          <div className='grid gap-3 md:grid-cols-3'>
            <EditorSelect
              control={control}
              name='repeat.weekday'
              label={t('eventos:info.repeat.weekday')}
              required
              options={weekdays}
            />
            <EditorField label={t('eventos:info.start')} required htmlFor='repeat-start'>
              <Input id='repeat-start' type='time' {...register('repeat.start')} />
            </EditorField>
            <EditorField label={t('eventos:info.end')} required htmlFor='repeat-end'>
              <Input id='repeat-end' type='time' {...register('repeat.end')} />
            </EditorField>
          </div>
          <div className='grid gap-3 md:grid-cols-3'>
            <EditorField label={t('eventos:info.repeat.from')} required htmlFor='repeat-from'>
              <Input id='repeat-from' type='date' {...register('repeat.from')} />
            </EditorField>
            <EditorField label={t('eventos:info.repeat.to')} required htmlFor='repeat-to'>
              <Input id='repeat-to' type='date' {...register('repeat.to')} />
            </EditorField>
            <EditorSelect
              control={control}
              name='repeat.place'
              label={t('eventos:info.place')}
              required
              options={roomOptions}
            />
          </div>
          <div className='flex flex-wrap justify-end gap-2'>
            <Button type='button' variant='outlined' color='primary' size='small' onClick={() => setRepeating(false)}>
              {t('eventos:participation.cancel')}
            </Button>
            <Button type='button' variant='solid' color='primary' size='small' onClick={applyRepeat}>
              {t('eventos:info.repeat.apply')}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
