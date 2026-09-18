import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { UpcomingBookingCard } from './upcoming-booking-card';

import { Button } from '@components/ui';
import { PageURLS } from '@core/constants';
import { getBookingCountdown, rentalStatusI18nKey, reservationDisplayTitle, type ReservationItem } from '@helpers';
import { useDateLocale } from '@hooks';

import type { MyBooking } from '@core/api';

interface UpcomingReservationCardProps {
  item: ReservationItem;
  isCancelDisabled?: boolean;
  onCancelClass: (booking: MyBooking) => void;
}

function DateBlock({ start }: { start: Date }) {
  const locale = useDateLocale();

  return (
    <div className='flex w-[52px] shrink-0 flex-col items-center gap-px rounded-[11px] bg-primary py-2 text-center text-primary-foreground'>
      <span className='text-[9.5px] font-semibold tracking-[0.08em] uppercase opacity-75'>
        {format(start, 'EEE', { locale })}
      </span>
      <span className='font-title text-[19px] leading-none font-bold'>{format(start, 'd')}</span>
      <span className='text-[9.5px] font-medium uppercase opacity-75'>{format(start, 'MMM', { locale })}</span>
    </div>
  );
}

function relativeLabel(startTime: string, t: (key: string, options?: Record<string, unknown>) => string) {
  const countdown = getBookingCountdown(startTime);

  if (countdown.kind === 'inProgress') {
    return t('bookings:countdown.inProgress');
  }

  if (countdown.kind === 'today') {
    return t('bookings:countdown.todayShort', { hours: countdown.hours });
  }

  if (countdown.kind === 'tomorrow') {
    return t('bookings:countdown.tomorrowShort');
  }

  if (countdown.kind === 'hours') {
    return t('bookings:countdown.inHours', { count: countdown.hours });
  }

  return t('bookings:countdown.inDays', { count: countdown.days });
}

export function UpcomingReservationCard({ item, isCancelDisabled, onCancelClass }: UpcomingReservationCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (item.kind === 'class') {
    return <UpcomingBookingCard booking={item.booking} isCancelDisabled={isCancelDisabled} onCancel={onCancelClass} />;
  }

  const start = new Date(item.startsAt);
  const lastRentalSlot =
    item.kind === 'rental'
      ? [...item.request.slots].sort((left, right) => left.end_time.localeCompare(right.end_time)).at(-1)
      : null;
  const title = reservationDisplayTitle(item, t);
  const schedule =
    item.kind === 'workshop'
      ? `${format(start, 'HH:mm')} – ${format(new Date(item.registration.ends_at), 'HH:mm')} · ${item.registration.room_name ?? t('bookings:unknown')}`
      : item.kind === 'rental'
        ? `${format(start, 'HH:mm')}${lastRentalSlot ? ` – ${format(new Date(lastRentalSlot.end_time), 'HH:mm')}` : ''} · ${item.roomName || t('bookings:unknown')}`
        : `${item.series.start_time.slice(0, 5)} – ${item.series.end_time.slice(0, 5)} · ${item.roomName || t('bookings:unknown')}`;
  const status =
    item.kind === 'workshop'
      ? item.registration.source === 'combo' && item.registration.combo_name
        ? `${t(`bookings:workshopStatus.${item.registration.status}`)} · ${item.registration.combo_name}`
        : t(`bookings:workshopStatus.${item.registration.status}`)
      : t(
          `studioRental:status.${rentalStatusI18nKey(item.kind === 'rental' ? item.request.status : item.series.status)}`,
        );

  return (
    <article className='flex min-w-0 items-start gap-[13px] rounded-[14px] border border-primary/20 bg-white px-[13px] py-3'>
      <DateBlock start={start} />
      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-baseline justify-between gap-2'>
          <h3 className='m-0 min-w-0 break-words font-title text-base leading-none font-semibold text-foreground'>
            {title}
          </h3>
          <p className='shrink-0 text-right text-[11px] leading-none font-medium text-primary'>
            {relativeLabel(item.startsAt, t)}
          </p>
        </div>
        <p className='mt-1 text-[12.5px] leading-[1.4] text-muted-foreground'>{schedule}</p>
        <div className='mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2'>
          <p className='m-0 text-xs font-medium text-muted-foreground'>{status}</p>
          {item.kind === 'workshop' ? (
            <div className='flex flex-wrap gap-2'>
              <Button
                type='button'
                variant='outlinePrimary'
                size='sm'
                onClick={() => navigate(PageURLS.tallerLanding(item.registration.workshop_slug))}
              >
                {t('bookings:viewWorkshop')}
              </Button>
              {item.registration.payment_intent_id && item.registration.status !== 'confirmed' ? (
                <Button
                  type='button'
                  variant='outlinePrimary'
                  size='sm'
                  onClick={() => navigate(`${PageURLS.paymentsResult}?intentId=${item.registration.payment_intent_id}`)}
                >
                  {t('bookings:viewPayment')}
                </Button>
              ) : null}
            </div>
          ) : (
            <Button
              type='button'
              variant='outlinePrimary'
              size='sm'
              onClick={() => {
                const intentId =
                  item.kind === 'rental' ? item.request.payment_intent_id : item.series.payment_intent_id;

                navigate(
                  intentId ? `${PageURLS.studioRentalResult}?intentId=${intentId}` : PageURLS.studioRentalRequests,
                );
              }}
            >
              {t('bookings:viewRental')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
