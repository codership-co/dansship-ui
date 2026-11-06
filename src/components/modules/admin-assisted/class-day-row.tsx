import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { Badge } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { type AssistedBookingItem, type PublishedClass } from '@core/api';
import { PERMISSION } from '@core/permissions';
import { useDateLocale } from '@hooks';

import type { ClassAvailability } from './class-availability';

/** One class of the day, with the person's booking in it if there is one. */
export interface ClassDayEntry {
  id: string;
  name: string;
  startTime: string;
  /** Present when the class is still published; a booking on a class that no longer is has none. */
  published?: PublishedClass;
  availability: ClassAvailability;
}

export interface ClassDayRowActions {
  onBook: (published: PublishedClass) => void;
  onMarkAttendance: (booking: AssistedBookingItem, isCorrection: boolean) => void;
  onCancel: (booking: AssistedBookingItem) => void;
  onAddCompanion: (booking: AssistedBookingItem) => void;
  onReimburse: (booking: AssistedBookingItem) => void;
}

const bookingOf = (availability: ClassAvailability) => ('booking' in availability ? availability.booking : undefined);

function StatusBadges({ entry }: { entry: ClassDayEntry }) {
  const { t } = useTranslation('assisted');
  const { availability } = entry;
  const booking = bookingOf(availability);
  const isHeld = new Date(entry.startTime) <= new Date();

  return (
    <div className='flex flex-wrap gap-2'>
      {entry.published?.two_for_one_eligible ? (
        <Badge variant='outlineActive' size='small'>
          2x1
        </Badge>
      ) : null}
      {isHeld ? (
        <Badge variant='outlineNeutral' size='small'>
          {t('class.held')}
        </Badge>
      ) : null}
      {availability.kind === 'reserved' ? (
        <Badge variant='outlineActive' size='small'>
          {t('class.status.reserved')}
        </Badge>
      ) : null}
      {availability.kind === 'attended' ? (
        <Badge variant='outlineActive' size='small'>
          {t('class.status.attended')}
        </Badge>
      ) : null}
      {availability.kind === 'noShow' ? (
        <Badge variant='outlineWarning' size='small'>
          {t('class.status.noShow')}
        </Badge>
      ) : null}
      {availability.kind === 'overlap' ? (
        <Badge variant='outlineWarning' size='small'>
          {t('class.status.overlap')}
        </Badge>
      ) : null}
      {availability.kind === 'free' && availability.cancelled ? (
        <Badge variant='outlineWarning' size='small'>
          {t('class.status.cancelled')}
        </Badge>
      ) : null}
      {booking && availability.kind !== 'overlap' ? (
        <Badge variant='outline' size='small'>
          {t(`class.origin.${booking.origin}`)}
        </Badge>
      ) : null}
      {booking?.credit_restored ? (
        <Badge variant='outlineActive' size='small'>
          {t('class.creditReturned')}
        </Badge>
      ) : null}
    </div>
  );
}

function RowActions({ entry, actions }: { entry: ClassDayEntry; actions: ClassDayRowActions }) {
  const { t } = useTranslation('assisted');
  const canCancel = useOrPermissions([PERMISSION.BOOKING_CANCEL]);
  const canRefund = useOrPermissions([PERMISSION.CLASS_CREDIT_REFUND]);
  const { availability, published } = entry;
  const isHeld = new Date(entry.startTime) <= new Date();
  const bookLabel = t(isHeld ? 'class.registerAttendance' : 'class.book');

  const companion = (booking: AssistedBookingItem) =>
    booking.can_add_companion ? (
      <Button color='primary' variant='outlined' size='small' onClick={() => actions.onAddCompanion(booking)}>
        {t('class.addCompanion')}
      </Button>
    ) : null;
  const reimburse = (booking: AssistedBookingItem) =>
    booking.can_reimburse && canRefund ? (
      <Button color='primary' variant='outlined' size='small' onClick={() => actions.onReimburse(booking)}>
        {t('class.reimburse')}
      </Button>
    ) : null;

  switch (availability.kind) {
    case 'free':
      return (
        <>
          {availability.cancelled ? reimburse(availability.cancelled) : null}
          {published ? (
            <Button color='primary' variant='solid' size='small' onClick={() => actions.onBook(published)}>
              {bookLabel}
            </Button>
          ) : null}
        </>
      );
    case 'reserved':
      return (
        <>
          {companion(availability.booking)}
          {canCancel ? (
            <Button color='alert' variant='text' size='small' onClick={() => actions.onCancel(availability.booking)}>
              {t('class.cancelAction')}
            </Button>
          ) : null}
        </>
      );
    case 'markAttendance':
      return (
        <>
          {companion(availability.booking)}
          <Button
            color='primary'
            variant='solid'
            size='small'
            onClick={() => actions.onMarkAttendance(availability.booking, false)}
          >
            {t('class.markAttendance')}
          </Button>
        </>
      );
    case 'attended':
      return (
        <>
          {companion(availability.booking)}
          {reimburse(availability.booking)}
        </>
      );
    case 'noShow':
      return (
        <>
          {reimburse(availability.booking)}
          <Button
            color='primary'
            variant='outlined'
            size='small'
            onClick={() => actions.onMarkAttendance(availability.booking, true)}
          >
            {t('class.correctAttendance')}
          </Button>
        </>
      );
    case 'overlap':
      return (
        <Button color='primary' variant='solid' size='small' disabled>
          {bookLabel}
        </Button>
      );
  }
}

export function ClassDayRow({ entry, actions }: { entry: ClassDayEntry; actions: ClassDayRowActions }) {
  const locale = useDateLocale();
  const { published } = entry;

  return (
    <li className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3'>
      <div className='grid gap-1'>
        <span className='font-medium'>{entry.name}</span>
        <span className='text-sm text-muted-foreground'>
          {format(parseISO(entry.startTime), 'p', { locale })}
          {published ? ` · ${published.enrolled_count}/${published.capacity}` : ''}
          {published?.instructor?.full_name ? ` · ${published.instructor.full_name}` : ''}
        </span>
        <StatusBadges entry={entry} />
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <RowActions entry={entry} actions={actions} />
      </div>
    </li>
  );
}
