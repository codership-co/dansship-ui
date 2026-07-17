import { format, parseISO } from 'date-fns';
import { AsideModal, Button } from 'polpo/components';
import { toCapitalize } from 'polpo/helpers';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Container } from '@components/containers';
import { ProfilePicture } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPI, PublishedClass } from '@core/api';
import { DEFAULT_ROOM_IMAGE, PageURLS } from '@core/constants';
import { formatTimeDifference } from '@helpers';
import { useDateLocale, usePromise, useMyBookings } from '@hooks';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: PublishedClass | null;
  hasActiveSubscription: boolean;
}

export function BookingModal({ isOpen, onClose, selectedClass, hasActiveSubscription }: BookingModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const locale = useDateLocale();
  const {
    bookClass,
    cancelClass,
    joinWaitlist,
    cancelWaitlist,
    isBookingClass,
    isCancelingClass,
    isJoiningWaitlist,
    isCancelingWaitlist,
  } = useMyBookings();
  const { response: myBookingsResponse } = usePromise(() => DansshipAPI.bookings.getMyBookings(), isAuthenticated);
  const myBookings = myBookingsResponse?.data ?? [];

  if (!selectedClass) return null;

  const isFull = selectedClass.enrolled_count >= selectedClass.capacity;

  // Here we check if the user is already booked via the injected `user_booking_status` field.
  const userStatus = selectedClass.user_booking_status;
  const isBooked = userStatus === 'active';
  const isWaitlisted = userStatus === 'waitlisted';

  const isLoading = isBookingClass || isCancelingClass || isJoiningWaitlist || isCancelingWaitlist;

  const hasTimeOverlap = myBookings.some(booking => {
    if (!booking.scheduled_class || booking.scheduled_class.id === selectedClass.id) return false;

    if (booking.status === 'cancelled') return false;

    const bookedStart = new Date(booking.scheduled_class.start_time).getTime();
    const bookedEnd = new Date(booking.scheduled_class.end_time).getTime();
    const classStart = new Date(selectedClass.start_time).getTime();
    const classEnd = new Date(selectedClass.end_time).getTime();

    return classStart < bookedEnd && bookedStart < classEnd;
  });

  const handleBook = async () => {
    try {
      await bookClass({ scheduled_class_id: selectedClass.id });
      onClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleCancel = async () => {
    if (!selectedClass.user_booking_id) return;

    try {
      await cancelClass(selectedClass.user_booking_id);
      onClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleWaitlistJoin = async () => {
    try {
      await joinWaitlist({ scheduled_class_id: selectedClass.id });
      onClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleWaitlistCancel = async () => {
    if (!selectedClass.user_booking_id) return;

    try {
      await cancelWaitlist(selectedClass.user_booking_id);
      onClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleBuyPlan = () => {
    onClose();
    navigate(PageURLS.profile.subscription);
  };

  return (
    <AsideModal
      isOpen={isOpen}
      onClose={onClose}
      position='right'
      size='600px'
      contentClassName='p-0 h-full overflow-auto grid grid-rows-[auto_1fr]'
    >
      <img
        src={DEFAULT_ROOM_IMAGE}
        alt='Room class'
        className='aspect-16/8 object-cover [@media(min-height:1000px)]:aspect-16/10'
      />
      <section className='grid gap-4 grid-rows-[1fr_auto] h-full overflow-auto'>
        <section className='grid gap-4 pt-4 px-8 content-start'>
          <h3 className='text-center text-primary'>
            {selectedClass.class_definition?.name || t('bookings:classDefault')}
          </h3>

          <Container className='bg-secondary/20 py-8 xs:py-4 grid grid-flow-row xs:grid-flow-col justify-center xs:justify-between gap-4 xs:gap-8 items-center shadow-none'>
            <section className='grid justify-items-center'>
              <ProfilePicture className='size-20 border-primary border-2' />
            </section>
            <section className='grid content-center text-center xs:text-right'>
              <p className='m-0 font-bold'>{selectedClass.instructor?.full_name || t('bookings:instructorTBA')}</p>
              <label className='m-0 whitespace-nowrap'>{t('bookings:instructor')}</label>
            </section>
          </Container>

          <Container className='bg-secondary/20 py-4 grid grid-flow-col justify-between gap-8 items-center shadow-none'>
            <section className='grid'>
              <p className='m-0 font-bold'>
                {toCapitalize(format(parseISO(selectedClass.start_time), 'EEEE', { locale }))}
              </p>
              <label className='m-0 whitespace-nowrap'>
                {format(parseISO(selectedClass.start_time), 'MMMM d', { locale })}
              </label>
            </section>
            <section className='grid content-center text-right'>
              <p className='m-0 font-bold'>{formatTimeDifference(selectedClass.end_time, selectedClass.start_time)}</p>
              <label className='m-0 whitespace-nowrap'>{t('bookings:duration')}</label>
            </section>
          </Container>

          <Container className='bg-secondary/20 py-4 grid grid-flow-col justify-between gap-8 items-center shadow-none'>
            <section className='grid'>
              <p className='m-0 font-bold'>{format(parseISO(selectedClass.start_time), 'h:mm a', { locale })}</p>
              <label className='m-0 whitespace-nowrap'>{t('bookings:startTime')}</label>
            </section>
            <section className='grid content-center text-right'>
              <p className='m-0 font-bold'>{format(parseISO(selectedClass.end_time), 'h:mm a', { locale })}</p>
              <label className='m-0 whitespace-nowrap'>{t('bookings:endTime')}</label>
            </section>
          </Container>

          <Container className='bg-secondary/20 py-4 grid grid-flow-col justify-between gap-8 items-center shadow-none'>
            <section className='grid'>
              <p className='m-0 font-bold'>
                {isFull ? `${t('bookings:spotsFull')}` : `${selectedClass.enrolled_count} / ${selectedClass.capacity}`}
              </p>
              <label className='m-0 whitespace-nowrap'>{t('bookings:capacity')}</label>
            </section>
            <section className='grid content-center text-right'>
              <p className='m-0 font-bold'>{selectedClass.room?.name || t('bookings:roomTBA')}</p>
              <label className='m-0 whitespace-nowrap'>{t('bookings:room')}</label>
            </section>
          </Container>
        </section>

        <section className='grid gap-4 px-8 pb-4'>
          {!hasActiveSubscription && !isBooked && !isWaitlisted && (
            <label className='bg-alert-50 p-3 rounded text-alert-800 border border-alert-200'>
              {t('bookings:noSubscriptionWarning')}
            </label>
          )}

          {hasTimeOverlap && !isBooked && !isWaitlisted && (
            <label className='bg-warning-50 p-3 rounded text-warning-800 border border-warning-200'>
              {t('bookings:timeOverlapWarning')}
            </label>
          )}

          <section className='flex flex-col gap-2'>
            {isBooked ? (
              <Button color='alert' onClick={handleCancel} isLoading={isLoading}>
                {isCancelingClass ? t('bookings:cancelling') : t('bookings:cancelBooking')}
              </Button>
            ) : isWaitlisted ? (
              <Button color='primary' variant='outlined' onClick={handleWaitlistCancel} isLoading={isLoading}>
                {isCancelingWaitlist ? t('bookings:leaving') : t('bookings:leaveWaitlist')}
              </Button>
            ) : !hasActiveSubscription ? (
              <Button color='primary' onClick={handleBuyPlan}>
                {t('bookings:buyPlan')}
              </Button>
            ) : isFull ? (
              <Button color='primary' onClick={handleWaitlistJoin} isLoading={isLoading}>
                {isJoiningWaitlist ? t('bookings:joining') : t('bookings:joinWaitlist')}
              </Button>
            ) : (
              <Button color='primary' onClick={handleBook} isLoading={isLoading}>
                {isBookingClass ? t('bookings:booking') : t('bookings:bookClass')}
              </Button>
            )}

            <Button color='primary' variant='text' onClick={onClose} isLoading={isLoading}>
              {t('common:close')}
            </Button>
          </section>
        </section>
      </section>
    </AsideModal>
  );
}
