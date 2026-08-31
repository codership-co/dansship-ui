import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Badge, Button, ProfilePicture } from '@components/ui';
import { canRateBooking, cn, isAcademyCancelledBooking, resolvePlanDisplayName } from '@helpers';
import { useDateLocale } from '@hooks';

import type { BookingStatus, MyBooking } from '@core/api';

interface HistoryBookingCardProps {
  booking: MyBooking;
  alreadyRated: boolean;
  onRate: (booking: MyBooking) => void;
}

const statusLabel = (booking: MyBooking, t: (key: string) => string) => {
  if (isAcademyCancelledBooking(booking)) {
    return t('bookings:status.cancelledByAcademy');
  }

  switch (booking.status as BookingStatus) {
    case 'active':
      return t('bookings:status.active');
    case 'cancelled':
      return t('bookings:status.cancelled');
    case 'attended':
      return t('bookings:status.attended');
    case 'no_show':
      return t('bookings:status.noShow');
    default:
      return booking.status;
  }
};

const statusBadgeClass = (booking: MyBooking) => {
  if (booking.status === 'attended') {
    return 'border-active text-active bg-transparent';
  }

  if (booking.status === 'no_show') {
    return 'border-alert text-alert bg-transparent';
  }

  if (booking.status === 'cancelled') {
    return 'border-accent text-muted-foreground bg-transparent';
  }

  return 'border-primary/40 text-primary bg-transparent';
};

export function HistoryBookingCard({ booking, alreadyRated, onRate }: HistoryBookingCardProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const cls = booking.scheduled_class;
  const start = new Date(cls.start_time);
  const className = cls.class_definition?.name ?? t('bookings:classFallback');
  const instructorName = cls.instructor?.full_name;
  const planName = booking.plan_name ? resolvePlanDisplayName(booking.plan_name, t) : null;
  const duration = cls.class_definition?.duration_minutes;
  const canRate = canRateBooking({
    status: booking.status,
    endTime: cls.end_time,
    instructorId: cls.instructor_id ?? cls.instructor?.id,
    alreadyRated,
    isCancelled: Boolean(cls.is_cancelled),
  });

  return (
    <article className='flex min-w-0 items-start gap-[13px] rounded-[15px] border border-border bg-white p-[13px]'>
      <div className='flex w-[52px] shrink-0 flex-col items-center gap-0.5 rounded-[11px] bg-muted py-[9px] text-center'>
        <span className='text-[9.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase'>
          {format(start, 'EEE', { locale })}
        </span>
        <span className='font-title text-[19px] leading-none font-bold text-primary'>{format(start, 'd')}</span>
        <span className='text-[9.5px] font-medium text-muted-foreground uppercase'>
          {format(start, 'MMM', { locale })}
        </span>
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-start justify-between gap-2'>
          <h3 className='m-0 min-w-0 break-words font-title text-base leading-[1.2] font-semibold text-foreground'>
            {className}
          </h3>
          <Badge
            variant='outline'
            className={cn(statusBadgeClass(booking), 'max-w-[9.5rem] whitespace-normal text-center')}
          >
            {statusLabel(booking, t)}
          </Badge>
        </div>
        <p className='mt-1 text-[12.5px] leading-[1.4] text-muted-foreground'>
          {format(start, 'HH:mm')} – {format(new Date(cls.end_time), 'HH:mm')}
          {duration ? ` · ${t('bookings:durationMinutes', { count: duration })}` : ''}
          {' · '}
          {cls.room?.name ?? t('bookings:unknown')}
        </p>
        <div className='mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2'>
          <div className='flex min-w-0 items-center gap-2'>
            <ProfilePicture
              className='size-8'
              image={cls.instructor?.photo_url || undefined}
              alt={instructorName ?? t('bookings:instructorTBA')}
              useAuthFallback={false}
            />
            <p className='min-w-0 truncate text-sm font-medium text-foreground'>
              {instructorName ?? t('bookings:instructorTBA')}
            </p>
            {planName ? (
              <span className='max-w-full shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground'>
                {planName}
              </span>
            ) : null}
          </div>

          {alreadyRated && booking.status === 'attended' ? (
            <p className='text-sm text-muted-foreground'>{t('bookings:rated')}</p>
          ) : canRate ? (
            <Button type='button' variant='outlinePrimary' size='sm' onClick={() => onRate(booking)}>
              {t('bookings:rateClass')}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
