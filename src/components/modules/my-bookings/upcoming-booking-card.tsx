import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Button } from '@components/ui';
import { canCancelBooking, getBookingCountdown, resolvePlanDisplayName } from '@helpers';
import { useDateLocale } from '@hooks';

import type { MyBooking } from '@core/api';

interface UpcomingBookingCardProps {
  booking: MyBooking;
  isCancelDisabled?: boolean;
  onCancel: (booking: MyBooking) => void;
}

export function UpcomingBookingCard({ booking, isCancelDisabled, onCancel }: UpcomingBookingCardProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const cls = booking.scheduled_class;
  const start = new Date(cls.start_time);
  const className = cls.class_definition?.name ?? t('bookings:classFallback');
  const instructorName = cls.instructor?.full_name ?? t('bookings:instructorTBA');
  const planName = booking.plan_name ? resolvePlanDisplayName(booking.plan_name, t) : null;
  const countdown = getBookingCountdown(cls.start_time);
  const showCancel = canCancelBooking(booking);

  const relativeLabel =
    countdown.kind === 'inProgress'
      ? t('bookings:countdown.inProgress')
      : countdown.kind === 'today'
        ? t('bookings:countdown.todayShort', { hours: countdown.hours })
        : countdown.kind === 'tomorrow'
          ? t('bookings:countdown.tomorrowShort')
          : countdown.kind === 'hours'
            ? t('bookings:countdown.inHours', { count: countdown.hours })
            : t('bookings:countdown.inDays', { count: countdown.days });

  return (
    <article className='flex items-start gap-[13px] rounded-[14px] border border-primary/20 bg-white px-[13px] py-3'>
      <div className='flex w-[52px] shrink-0 flex-col items-center gap-px rounded-[11px] bg-primary py-2 text-center text-primary-foreground'>
        <span className='text-[9.5px] font-semibold tracking-[0.08em] uppercase opacity-75'>
          {format(start, 'EEE', { locale })}
        </span>
        <span className='font-title text-[19px] leading-none font-bold'>{format(start, 'd')}</span>
        <span className='text-[9.5px] font-medium uppercase opacity-75'>{format(start, 'MMM', { locale })}</span>
      </div>

      <div className='min-w-0 flex-1'>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='m-0 font-title text-base leading-[1.2] font-semibold text-foreground'>{className}</h3>
          <p className='shrink-0 text-[11px] leading-[1.2] font-medium text-primary'>{relativeLabel}</p>
        </div>
        <p className='mt-1 truncate text-[12.5px] leading-[1.4] text-muted-foreground'>
          {format(start, 'HH:mm')} – {format(new Date(cls.end_time), 'HH:mm')}
          {' · '}
          {instructorName}
          {planName ? ` · ${planName}` : ''}
        </p>
        <div className='mt-3 flex justify-end'>
          {showCancel ? (
            <Button
              type='button'
              variant='link'
              size='sm'
              className='h-auto px-0'
              disabled={isCancelDisabled}
              onClick={() => onCancel(booking)}
            >
              {t('bookings:cancelLink')}
            </Button>
          ) : (
            <p className='text-xs text-muted-foreground'>
              {planName ? t('bookings:notCancellableWithPlan', { plan: planName }) : t('bookings:notCancellable')}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
