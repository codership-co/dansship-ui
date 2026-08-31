import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Button, ProfilePicture } from '@components/ui';
import { canCancelBooking, getBookingCountdown, resolvePlanDisplayName } from '@helpers';
import { useDateLocale } from '@hooks';

import type { MyBooking } from '@core/api';

interface NextClassHeroProps {
  booking: MyBooking;
  isCancelDisabled?: boolean;
  onCancel: (booking: MyBooking) => void;
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

function instructorInitials(name?: string | null) {
  if (!name?.trim()) {
    return '';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
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

export function NextClassHero({ booking, isCancelDisabled, onCancel }: NextClassHeroProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const cls = booking.scheduled_class;
  const start = new Date(cls.start_time);
  const className = cls.class_definition?.name ?? t('bookings:classFallback');
  const instructorName = cls.instructor?.full_name;
  const instructorPhoto = cls.instructor?.photo_url || undefined;
  const planName = booking.plan_name ? resolvePlanDisplayName(booking.plan_name, t) : null;
  const showCancel = canCancelBooking(booking);
  const initials = instructorInitials(instructorName);

  return (
    <article className='relative overflow-hidden rounded-[18px] bg-primary px-5 py-[18px] text-primary-foreground sm:px-5 sm:pb-5'>
      <HeroWaves />
      <div className='pointer-events-none absolute -right-10 -bottom-[70px] size-[190px] rounded-full bg-accent opacity-[0.22]' />

      <div className='relative flex min-w-0 flex-col gap-3.5'>
        <div className='flex min-w-0 items-start justify-between gap-3'>
          <div className='flex min-w-0 flex-1 flex-col gap-1.5'>
            <p className='text-[10.5px] font-semibold tracking-[0.14em] text-secondary uppercase'>
              {formatCountdownLabel(cls.start_time, t)}
            </p>
            <h3 className='m-0 break-words font-title text-[1.875rem] leading-[1.05] font-bold'>{className}</h3>
          </div>
          <span className='flex-none rounded-full border border-white/32 bg-white/16 px-2.5 py-[5px] text-[10.5px] leading-[1.4] font-semibold'>
            {t('bookings:status.active')}
          </span>
        </div>

        <div className='flex flex-wrap gap-x-[22px] gap-y-2'>
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm leading-[1.3] font-semibold'>
              {`${format(start, 'EEE d', { locale })} de ${format(start, 'MMMM', { locale })}`}
            </span>
            <span className='text-[12.5px] leading-[1.3] opacity-80'>
              {format(start, 'HH:mm')} – {format(new Date(cls.end_time), 'HH:mm')}
            </span>
          </div>
          <div className='flex flex-col gap-0.5'>
            <span className='text-sm leading-[1.3] font-semibold'>{cls.room?.name ?? t('bookings:unknown')}</span>
            {planName ? (
              <span className='text-[12.5px] leading-[1.3] opacity-80'>
                {t('bookings:planLabel', { name: planName })}
              </span>
            ) : null}
          </div>
        </div>

        <div className='flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-white/22 pt-3.5'>
          <div className='flex min-w-0 flex-1 items-center gap-2.5'>
            {instructorPhoto ? (
              <ProfilePicture
                className='size-[30px] border-0 bg-white/20'
                image={instructorPhoto}
                alt={instructorName ?? t('bookings:instructorTBA')}
                useAuthFallback={false}
              />
            ) : (
              <div className='grid size-[30px] flex-none place-items-center rounded-full bg-white/22 text-[11px] font-semibold'>
                {initials || '—'}
              </div>
            )}
            <div className='flex min-w-0 flex-col'>
              <span className='truncate text-[12.5px] leading-[1.3] font-semibold'>
                {instructorName ?? t('bookings:instructorTBA')}
              </span>
              <span className='text-[10.5px] leading-[1.3] opacity-70'>{t('bookings:instructorRole')}</span>
            </div>
          </div>

          {showCancel ? (
            <Button
              type='button'
              variant='outline'
              size='lg'
              disabled={isCancelDisabled}
              className='h-11 max-w-full border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white'
              onClick={() => onCancel(booking)}
            >
              {t('bookings:cancelReservation')}
            </Button>
          ) : (
            <p className='max-w-full text-xs break-words text-white/70'>
              {planName ? t('bookings:notCancellableWithPlan', { plan: planName }) : t('bookings:notCancellable')}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
