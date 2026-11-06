import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BookingConfirmDialog } from './booking-confirm-dialog';
import { PersonGate } from './person-gate';
import { UpcomingBookings } from './upcoming-bookings';

import { Badge, DatePicker, Label } from '@components/ui';
import { DansshipAPI, type PersonSearchResult, type PublishedClass } from '@core/api';
import { getColombiaWeekRangeUtc, getMonday } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

const BOGOTA_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
});

function todayInBogota() {
  return BOGOTA_DAY.format(new Date());
}

function ClassPanel({ person }: { person: PersonSearchResult }) {
  const { t } = useTranslation('assisted');
  const locale = useDateLocale();
  const [day, setDay] = useState(todayInBogota);
  const [selected, setSelected] = useState<PublishedClass | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { startAt, endAt } = getColombiaWeekRangeUtc(getMonday(new Date(`${day}T12:00:00`)));
  const { response, isLoading } = usePromise(
    () => DansshipAPI.schedules.getPublishedClassesByRange(startAt, endAt),
    Boolean(day),
    [startAt, endAt],
  );
  const classes = useMemo(
    () =>
      (response?.ok ? response.data : [])
        .filter(item => !item.is_cancelled && BOGOTA_DAY.format(new Date(item.start_time)) === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [response, day],
  );

  return (
    <div className='grid gap-8'>
      <section className='grid gap-3'>
        <div className='grid max-w-xs gap-2'>
          <Label htmlFor='assisted-class-day'>{t('class.date')}</Label>
          <DatePicker
            boundary='local'
            date={parseISO(day)}
            dateFormat='EEE d MMM yyyy'
            placeholder={t('class.date')}
            onDateChange={date => date && setDay(format(date, 'yyyy-MM-dd'))}
          />
        </div>
        {isLoading ? <p className='text-sm text-muted-foreground'>{t('common.loading')}</p> : null}
        {!isLoading && classes.length === 0 ? (
          <p className='text-sm text-muted-foreground'>{t('class.noClasses')}</p>
        ) : null}
        <ul className='grid gap-2'>
          {classes.map(item => {
            const isHeld = new Date(item.start_time) <= new Date();

            return (
              <li
                key={item.id}
                className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3'
              >
                <div className='grid gap-1'>
                  <span className='font-medium'>{item.class_definition?.name}</span>
                  <span className='text-sm text-muted-foreground'>
                    {format(parseISO(item.start_time), 'p', { locale })} · {item.enrolled_count}/{item.capacity}
                    {item.instructor?.full_name ? ` · ${item.instructor.full_name}` : ''}
                  </span>
                  <div className='flex gap-2'>
                    {item.two_for_one_eligible ? (
                      <Badge variant='outlineActive' size='small'>
                        2x1
                      </Badge>
                    ) : null}
                    {isHeld ? (
                      <Badge variant='outlineNeutral' size='small'>
                        {t('class.held')}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <Button color='primary' variant='solid' size='small' onClick={() => setSelected(item)}>
                  {t(isHeld ? 'class.registerAttendance' : 'class.book')}
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
      <UpcomingBookings userId={person.id} personName={person.full_name} refreshKey={refreshKey} />
      {selected ? (
        <BookingConfirmDialog
          person={person}
          scheduledClass={selected}
          isHeld={new Date(selected.start_time) <= new Date()}
          onOpenChange={open => !open && setSelected(null)}
          onDone={() => setRefreshKey(value => value + 1)}
        />
      ) : null}
    </div>
  );
}

export function ClassTab() {
  return <PersonGate>{person => <ClassPanel key={person.id} person={person} />}</PersonGate>;
}
