import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { HistoryBookingCard } from './history-booking-card';

import { Badge, Button } from '@components/ui';
import { PageURLS } from '@core/constants';
import { cn, rentalStatusI18nKey, reservationDisplayTitle, type ReservationItem } from '@helpers';
import { useDateLocale } from '@hooks';

import type { MyBooking } from '@core/api';

interface HistoryReservationCardProps {
  item: ReservationItem;
  alreadyRated: boolean;
  onRateClass: (booking: MyBooking) => void;
}

function DateBlock({ start }: { start: Date }) {
  const locale = useDateLocale();

  return (
    <div className='flex w-[52px] shrink-0 flex-col items-center gap-0.5 rounded-[11px] bg-muted py-[9px] text-center'>
      <span className='text-[9.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase'>
        {format(start, 'EEE', { locale })}
      </span>
      <span className='font-title text-[19px] leading-none font-bold text-primary'>{format(start, 'd')}</span>
      <span className='text-[9.5px] font-medium text-muted-foreground uppercase'>
        {format(start, 'MMM', { locale })}
      </span>
    </div>
  );
}

export function HistoryReservationCard({ item, alreadyRated, onRateClass }: HistoryReservationCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (item.kind === 'class') {
    return <HistoryBookingCard booking={item.booking} alreadyRated={alreadyRated} onRate={onRateClass} />;
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
  const intentId =
    item.kind === 'workshop'
      ? item.registration.payment_intent_id
      : item.kind === 'rental'
        ? item.request.payment_intent_id
        : item.series.payment_intent_id;

  return (
    <article className='flex min-w-0 items-start gap-[13px] rounded-[15px] border border-border bg-white p-[13px]'>
      <DateBlock start={start} />
      <div className='min-w-0 flex-1'>
        <div className='flex min-w-0 items-start justify-between gap-2'>
          <h3 className='m-0 min-w-0 break-words font-title text-base leading-[1.2] font-semibold text-foreground'>
            {title}
          </h3>
          <Badge variant='outline' className={cn('border-primary/40 text-primary bg-transparent')}>
            {status}
          </Badge>
        </div>
        <p className='mt-1 text-[12.5px] leading-[1.4] text-muted-foreground'>{schedule}</p>
        <div className='mt-3 flex min-w-0 flex-wrap items-center justify-end gap-2'>
          {item.kind === 'workshop' ? (
            <>
              <Button
                type='button'
                variant='outlinePrimary'
                size='sm'
                onClick={() => navigate(PageURLS.tallerLanding(item.registration.workshop_slug))}
              >
                {t('bookings:viewWorkshop')}
              </Button>
              {intentId && item.registration.status !== 'confirmed' ? (
                <Button
                  type='button'
                  variant='outlinePrimary'
                  size='sm'
                  onClick={() => navigate(`${PageURLS.paymentsResult}?intentId=${intentId}`)}
                >
                  {t('bookings:viewPayment')}
                </Button>
              ) : null}
            </>
          ) : (
            <Button
              type='button'
              variant='outlinePrimary'
              size='sm'
              onClick={() =>
                navigate(
                  intentId ? `${PageURLS.studioRentalResult}?intentId=${intentId}` : PageURLS.studioRentalRequests,
                )
              }
            >
              {t('bookings:viewRental')}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
