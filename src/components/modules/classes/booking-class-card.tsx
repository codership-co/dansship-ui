import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ProfilePicture } from '@components/ui';
import { PublishedClass } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatTimeDifference } from '@helpers';

const image =
  'https://content.arquitecturaydiseno.es/medio/2023/12/06/casa-meritxell-ribe-angli-05_5001cc3f_231206133301_1280x794.jpg';

interface BookingClassCardProps {
  bookingClass: PublishedClass;
  hasOverlap: (bookingClass: PublishedClass) => boolean;
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
}

export function BookingClassCard({ bookingClass, hasOverlap, onClick }: BookingClassCardProps) {
  const { t } = useTranslation();
  const isFull = bookingClass.enrolled_count >= bookingClass.capacity;
  const isBooked = bookingClass.user_booking_status === 'active';
  const isWaitlisted = bookingClass.user_booking_status === 'waitlisted';

  return (
    <section
      key={bookingClass.id}
      className={cn(
        'relative select-none rounded-2xl gap-3 px-4 py-4 pt-20 xs:pt-30 sm:pt-40 transition-all',
        'hover:scale-102 hover:shadow-[0_40px_30px_-30px_#00000055]',
        'group relative grid content-end',
      )}
    >
      <section
        className='absolute -z-10 top-0 left-0 size-full rounded-2xl'
        style={{
          background: `url('${image}') center center / cover`,
        }}
      />

      <p
        className={cn(
          'absolute block font-bold top-0 right-0 m-4 py-1 px-4 bg-accent-200 text-primary rounded-2xl',
          isFull && 'bg-gray-100 text-gray-400',
        )}
      >
        {isFull ? `${t('bookings:spotsFull')}` : `${bookingClass.enrolled_count} / ${bookingClass.capacity}`}
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
          <Link
            to={PageURLS.userId(bookingClass.instructor?.id ?? '')}
            className='grid gap-4 w-40 content-center justify-items-center text-center'
          >
            <ProfilePicture className='size-20 border-primary border-2' />
            <p className='font-bold m-0 text-primary'>
              {bookingClass.instructor?.full_name || t('bookings:instructorTBA')}
            </p>
          </Link>
        </section>
        {hasOverlap(bookingClass) && !isBooked && !isWaitlisted && (
          <p className='text-warning-600'>⚠ {t('bookings:timeOverlapWarning')}</p>
        )}
      </section>

      <Button
        type='button'
        color='primary'
        variant='solid'
        onClick={onClick}
        className='absolute top-full right-8 -translate-y-1/2'
        disabled={isBooked || isWaitlisted || hasOverlap(bookingClass)}
      >
        {isFull
          ? t('bookings:joinWaitlist')
          : isWaitlisted
            ? t('bookings:status.waitlisted')
            : isBooked
              ? `${t('bookings:booked')} ✓`
              : t('bookings:bookClass')}
      </Button>
    </section>
  );
}
