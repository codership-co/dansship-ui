import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AttendanceDialog } from './attendance-dialog';
import { BookingConfirmDialog } from './booking-confirm-dialog';
import { AddCompanionDialog, CancelBookingDialog, ReimburseDialog } from './booking-dialogs';
import { classAvailability } from './class-availability';
import { ClassDayRow, type ClassDayEntry, type ClassDayRowActions } from './class-day-row';
import { PersonGate } from './person-gate';

import { DatePicker, Label } from '@components/ui';
import { type AssistedBookingItem, DansshipAPI, type PersonSearchResult, type PublishedClass } from '@core/api';
import { getColombiaWeekRangeUtc, getMonday } from '@helpers';
import { usePromise } from '@hooks';

const BOGOTA_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Bogota',
});

function todayInBogota() {
  return BOGOTA_DAY.format(new Date());
}

/**
 * The day's classes and the person's bookings as one list: a published class carries the booking made
 * in it, and a booking whose class is no longer published still shows so it can be cancelled or reimbursed.
 */
function dayEntries(
  published: Array<PublishedClass>,
  bookings: Array<AssistedBookingItem>,
  day: string,
): Array<ClassDayEntry> {
  const classes = published.filter(item => !item.is_cancelled && BOGOTA_DAY.format(new Date(item.start_time)) === day);
  const known = new Set(classes.map(item => item.id));
  const fromClasses = classes.map(item => ({
    id: item.id,
    name: item.class_definition?.name ?? '',
    startTime: item.start_time,
    published: item,
    availability: classAvailability(item, bookings),
  }));
  const orphans = bookings
    .filter(item => !known.has(item.scheduled_class_id))
    .map(item => ({
      id: item.scheduled_class_id,
      name: item.class_name ?? '',
      startTime: item.start_time,
      availability: classAvailability(
        { id: item.scheduled_class_id, start_time: item.start_time, end_time: item.end_time ?? item.start_time },
        bookings,
      ),
    }));

  return [...fromClasses, ...orphans].sort((left, right) => left.startTime.localeCompare(right.startTime));
}

function ClassPanel({ person }: { person: PersonSearchResult }) {
  const { t } = useTranslation('assisted');
  const [day, setDay] = useState(todayInBogota);
  const [booking, setBooking] = useState<PublishedClass | null>(null);
  const [adjusting, setAdjusting] = useState<{ booking: AssistedBookingItem; isCorrection: boolean } | null>(null);
  const [acting, setActing] = useState<{
    kind: 'cancel' | 'companion' | 'reimburse';
    booking: AssistedBookingItem;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey(value => value + 1);
  const { startAt, endAt } = getColombiaWeekRangeUtc(getMonday(new Date(`${day}T12:00:00`)));
  const { response, isLoading } = usePromise(
    () => DansshipAPI.schedules.getPublishedClassesByRange(startAt, endAt),
    Boolean(day),
    [startAt, endAt],
  );
  const { response: bookingsResponse } = usePromise(
    () => DansshipAPI.assistedAdmin.listBookingsForDay(person.id, day),
    Boolean(day),
    [person.id, day, refreshKey],
  );
  const entries = useMemo(
    () => dayEntries(response?.ok ? response.data : [], bookingsResponse?.data ?? [], day),
    [response, bookingsResponse, day],
  );

  const actions: ClassDayRowActions = {
    onBook: setBooking,
    onMarkAttendance: (item, isCorrection) => setAdjusting({ booking: item, isCorrection }),
    onCancel: item => setActing({ kind: 'cancel', booking: item }),
    onAddCompanion: item => setActing({ kind: 'companion', booking: item }),
    onReimburse: item => setActing({ kind: 'reimburse', booking: item }),
  };
  const closeActing = (open: boolean) => !open && setActing(null);

  return (
    <div className='grid gap-3'>
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
      {isLoading ? <p className='m-0 text-sm text-muted-foreground'>{t('common.loading')}</p> : null}
      {!isLoading && entries.length === 0 ? (
        <p className='m-0 text-sm text-muted-foreground'>{t('class.noClasses')}</p>
      ) : null}
      <ul className='m-0 grid list-none gap-2 p-0'>
        {entries.map(entry => (
          <ClassDayRow key={entry.id} entry={entry} actions={actions} />
        ))}
      </ul>
      {acting?.kind === 'cancel' ? (
        <CancelBookingDialog booking={acting.booking} onOpenChange={closeActing} onDone={refresh} />
      ) : null}
      {acting?.kind === 'companion' ? (
        <AddCompanionDialog booking={acting.booking} userId={person.id} onOpenChange={closeActing} onDone={refresh} />
      ) : null}
      {acting?.kind === 'reimburse' ? (
        <ReimburseDialog booking={acting.booking} onOpenChange={closeActing} onDone={refresh} />
      ) : null}
      {adjusting ? (
        <AttendanceDialog
          booking={adjusting.booking}
          isCorrection={adjusting.isCorrection}
          onOpenChange={open => !open && setAdjusting(null)}
          onDone={refresh}
        />
      ) : null}
      {booking ? (
        <BookingConfirmDialog
          person={person}
          scheduledClass={booking}
          isHeld={new Date(booking.start_time) <= new Date()}
          onOpenChange={open => !open && setBooking(null)}
          onDone={refresh}
        />
      ) : null}
    </div>
  );
}

export function ClassTab() {
  return <PersonGate>{person => <ClassPanel key={person.id} person={person} />}</PersonGate>;
}
