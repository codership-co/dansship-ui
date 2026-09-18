import { format } from 'date-fns';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { NextClassHero } from './next-class-hero';

import { Button } from '@components/ui';
import { PageURLS } from '@core/constants';
import { getBookingCountdown, rentalStatusI18nKey, reservationDisplayTitle, type ReservationItem } from '@helpers';
import { useDateLocale } from '@hooks';

import type { MyBooking } from '@core/api';

interface NextReservationHeroProps {
  item: ReservationItem;
  isCancelDisabled?: boolean;
  onCancelClass: (booking: MyBooking) => void;
}

function formatCountdownLabel(startTime: string, t: (key: string, options?: Record<string, unknown>) => string) {
  const countdown = getBookingCountdown(startTime);

  switch (countdown.kind) {
    case 'inProgress':
      return t('bookings:countdown.inProgress');
    case 'today':
      return t('bookings:countdown.today', { hours: countdown.hours });
    case 'tomorrow':
      return t('bookings:countdown.tomorrow', { hours: countdown.hours });
    case 'hours':
      return t('bookings:countdown.inHours', { count: countdown.hours });
    default:
      return t('bookings:countdown.inDays', { count: countdown.days });
  }
}

function HeroWaves() {
  return (
    <svg
      className='pointer-events-none absolute inset-0 h-full w-full text-primary-foreground'
      viewBox='0 0 420 220'
      preserveAspectRatio='xMaxYMid slice'
      aria-hidden
    >
      <path
        d='M248 0c28 18 48 42 86 48 28 4 56-6 86-4v176H214c8-38 22-62 42-96 16-28 18-52-8-124Z'
        fill='currentColor'
        opacity='0.1'
      />
      <path
        d='M292 12c32 22 58 38 128 36v172H286c6-34 18-58 36-90 14-26 8-48-30-118Z'
        fill='currentColor'
        opacity='0.08'
      />
      <path d='M180 196c42-18 78-8 120 8 28 10 54 8 120-6v16H180z' fill='currentColor' opacity='0.06' />
    </svg>
  );
}

function GenericHero({
  item,
  title,
  start,
  endLabel,
  roomLabel,
  statusLabel,
  detail,
  actions,
}: {
  item: ReservationItem;
  title: string;
  start: Date;
  endLabel: string;
  roomLabel: string;
  statusLabel: string;
  detail?: string | null;
  actions: ReactNode;
}) {
  const { t } = useTranslation();
  const locale = useDateLocale();

  return (
    <article className='relative overflow-hidden rounded-[18px] bg-primary px-5 py-[18px] text-primary-foreground sm:px-5 sm:pb-5'>
      <HeroWaves />
      <div className='pointer-events-none absolute -right-10 -bottom-[70px] size-[190px] rounded-full bg-accent opacity-[0.22]' />
      <div className='relative flex min-w-0 flex-col gap-3.5'>
        <div className='flex min-w-0 items-start justify-between gap-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
            <p className='m-0 text-[10.5px] font-semibold tracking-[0.14em] text-secondary uppercase'>
              {formatCountdownLabel(item.startsAt, t)}
            </p>
            <h3 className='m-0 break-words font-title text-[1.875rem] leading-[1.05] font-bold'>{title}</h3>
          </div>
          <span className='flex-none rounded-full border border-white/32 bg-white/16 px-2.5 py-[5px] text-[10.5px] leading-[1.4] font-semibold'>
            {statusLabel}
          </span>
        </div>
        <div className='flex flex-wrap gap-x-[22px] gap-y-2'>
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm leading-[1.3] font-semibold'>
              {`${format(start, 'EEE d', { locale })} de ${format(start, 'MMMM', { locale })}`}
            </span>
            <span className='text-[12.5px] leading-[1.3] opacity-80'>{endLabel}</span>
          </div>
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm leading-[1.3] font-semibold'>{roomLabel}</span>
            {detail ? <span className='text-[12.5px] leading-[1.3] opacity-80'>{detail}</span> : null}
          </div>
        </div>
        <div className='flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-white/22 pt-3.5'>
          {actions}
        </div>
      </div>
    </article>
  );
}

export function NextReservationHero({ item, isCancelDisabled, onCancelClass }: NextReservationHeroProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (item.kind === 'class') {
    return <NextClassHero booking={item.booking} isCancelDisabled={isCancelDisabled} onCancel={onCancelClass} />;
  }

  if (item.kind === 'workshop') {
    const registration = item.registration;
    const start = new Date(registration.starts_at);
    const end = new Date(registration.ends_at);

    return (
      <GenericHero
        item={item}
        title={reservationDisplayTitle(item, t)}
        start={start}
        endLabel={`${format(start, 'HH:mm')} – ${format(end, 'HH:mm')}`}
        roomLabel={registration.room_name ?? t('bookings:unknown')}
        statusLabel={t(`bookings:workshopStatus.${registration.status}`)}
        detail={
          registration.source === 'combo' && registration.combo_name
            ? registration.combo_name
            : (registration.instructor_name ?? null)
        }
        actions={
          <>
            <Button
              type='button'
              variant='outline'
              size='lg'
              className='h-11 max-w-full border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white'
              onClick={() => navigate(PageURLS.tallerLanding(registration.workshop_slug))}
            >
              {t('bookings:viewWorkshop')}
            </Button>
            {registration.payment_intent_id && registration.status !== 'confirmed' ? (
              <Button
                type='button'
                variant='outline'
                size='lg'
                className='h-11 max-w-full border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white'
                onClick={() => navigate(`${PageURLS.paymentsResult}?intentId=${registration.payment_intent_id}`)}
              >
                {t('bookings:viewPayment')}
              </Button>
            ) : null}
          </>
        }
      />
    );
  }

  if (item.kind === 'rental') {
    const request = item.request;
    const start = new Date(item.startsAt);
    const lastSlot = [...request.slots].sort((left, right) => left.end_time.localeCompare(right.end_time)).at(-1);

    return (
      <GenericHero
        item={item}
        title={reservationDisplayTitle(item, t)}
        start={start}
        endLabel={
          lastSlot
            ? `${format(start, 'HH:mm')} – ${format(new Date(lastSlot.end_time), 'HH:mm')}`
            : format(start, 'HH:mm')
        }
        roomLabel={item.roomName || t('bookings:unknown')}
        statusLabel={t(`studioRental:status.${rentalStatusI18nKey(request.status)}`)}
        actions={
          <Button
            type='button'
            variant='outline'
            size='lg'
            className='h-11 max-w-full border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white'
            onClick={() =>
              navigate(
                request.payment_intent_id
                  ? `${PageURLS.studioRentalResult}?intentId=${request.payment_intent_id}`
                  : PageURLS.studioRentalRequests,
              )
            }
          >
            {t('bookings:viewRental')}
          </Button>
        }
      />
    );
  }

  const series = item.series;
  const start = new Date(item.startsAt);

  return (
    <GenericHero
      item={item}
      title={reservationDisplayTitle(item, t)}
      start={start}
      endLabel={`${series.start_time.slice(0, 5)} – ${series.end_time.slice(0, 5)}`}
      roomLabel={item.roomName || t('bookings:unknown')}
      statusLabel={t(`studioRental:status.${rentalStatusI18nKey(series.status)}`)}
      detail={t(`common:days.${series.day_of_week}`)}
      actions={
        <Button
          type='button'
          variant='outline'
          size='lg'
          className='h-11 max-w-full border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white'
          onClick={() =>
            navigate(
              series.payment_intent_id
                ? `${PageURLS.studioRentalResult}?intentId=${series.payment_intent_id}`
                : PageURLS.studioRentalRequests,
            )
          }
        >
          {t('bookings:viewRental')}
        </Button>
      }
    />
  );
}
