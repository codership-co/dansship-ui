import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { useTranslation } from 'react-i18next';

import { ProfilePicture } from '@components/ui';
import { PublishedClass } from '@core/api';
import { DEFAULT_ROOM_IMAGE } from '@core/constants';
import { formatTimeDifference, isPastBookingDeadline } from '@helpers';

interface BookingClassCardProps {
  bookingClass: PublishedClass;
  hasOverlap: (bookingClass: PublishedClass) => boolean;
  onClick: () => void;
}

export function BookingClassCard({ bookingClass, hasOverlap, onClick }: BookingClassCardProps) {
  const { t } = useTranslation();
  const isCancelled = Boolean(bookingClass.is_cancelled);
  const isFull = bookingClass.enrolled_count >= bookingClass.capacity;
  const isPast = isPastBookingDeadline(bookingClass.start_time);
  const isUnavailable = isPast || isFull || isCancelled;
  const isBooked = bookingClass.user_booking_status === 'active';
  const isBookButtonDisabled = isPast || isCancelled || isBooked || hasOverlap(bookingClass) || isFull;

  return (
    <section
      key={bookingClass.id}
      role='button'
      tabIndex={0}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative select-none rounded-2xl gap-3 px-4 py-4 pt-20 xs:pt-30 sm:pt-40 transition-all cursor-pointer',
        'hover:scale-102 hover:shadow-[0_40px_30px_-30px_#00000055]',
        'group relative grid content-end',
        isUnavailable && 'grayscale opacity-60',
      )}
    >
      <section
        className='absolute -z-10 top-0 left-0 size-full rounded-2xl'
        style={{
          background: `url('${bookingClass.room?.image_url || DEFAULT_ROOM_IMAGE}') center center / cover`,
        }}
      />

      <p
        className={cn(
          'absolute block font-bold top-0 right-0 m-4 py-1 px-4 bg-accent-200 text-primary rounded-2xl',
          isUnavailable && 'bg-gray-100 text-gray-400',
        )}
      >
        {isCancelled
          ? t('bookings:classCancelledBadge')
          : isFull
            ? `${t('bookings:spotsFull')}`
            : `${bookingClass.enrolled_count} / ${bookingClass.capacity}`}
      </p>

      <section className='bg-white/50 backdrop-blur-md py-4 px-8 grid gap-4 rounded-xl'>
        <h3 className='text-primary text-center sm:text-left'>
          {bookingClass.class_definition?.name || t('bookings:classDefault')}
        </h3>
        <section className='flex flex-col-reverse sm:flex-row gap-8 items-center justify-between pb-4'>
          <section className='grid grid-cols-[1fr_1fr] sm:grid-cols-none sm:grid-flow-col gap-8 items-center'>
            <section className='text-center'>
              <h4 className='m-0'>{format(new Date(bookingClass.start_time), 'H:mm a')}</h4>
              <label>{t('bookings:startTime')}</label>
            </section>
            <section className='text-center'>
              <h4 className='m-0'>{formatTimeDifference(bookingClass.end_time, bookingClass.start_time)}</h4>
              <label>{t('bookings:duration')}</label>
            </section>
            <section className='text-center'>
              <h4 className='m-0'>{bookingClass.room?.name || t('bookings:roomTBA')}</h4>
              <label>{t('bookings:room')}</label>
            </section>
          </section>
          <section className='grid gap-4 w-40 content-center justify-items-center text-center'>
            <ProfilePicture
              className='size-20 border-primary border-2'
              image={bookingClass.instructor?.photo_url || undefined}
              alt={bookingClass.instructor?.full_name || t('bookings:instructorTBA')}
              useAuthFallback={false}
            />
            <p className='font-bold m-0 text-primary'>
              {bookingClass.instructor?.full_name || t('bookings:instructorTBA')}
            </p>
          </section>
        </section>
        {hasOverlap(bookingClass) && !isBooked && (
          <p className='text-warning-600'>⚠ {t('bookings:timeOverlapWarning')}</p>
        )}
      </section>

      <Button
        type='button'
        color='primary'
        variant='solid'
        disabled={isBookButtonDisabled}
        className={cn('absolute top-full right-8 -translate-y-1/2', isBookButtonDisabled && 'pointer-events-none')}
        tabIndex={-1}
      >
        {isPast
          ? t('bookings:bookingWindowClosed')
          : isCancelled
            ? t('bookings:classCancelledMessage')
            : isFull
              ? t('bookings:spotsFull')
              : isBooked
                ? `${t('bookings:booked')} ✓`
                : t('bookings:bookClass')}
      </Button>
    </section>
  );
}
