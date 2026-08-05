import { format, parseISO } from 'date-fns';
import { AsideModal, Button } from 'polpo/components';
import { cn, toCapitalize } from 'polpo/helpers';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Container } from '@components/containers';
import { ConfirmDialog } from '@components/modals';
import { ProfilePicture } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPI, ActiveSubscription, PublishedClass } from '@core/api';
import { DEFAULT_ROOM_IMAGE, PageURLS } from '@core/constants';
import { formatTimeDifference, getClassBookingEligibility, isPastBookingDeadline } from '@helpers';
import { useDateLocale, usePromise, useMyBookings } from '@hooks';

type BookingConfirmAction = 'cancel' | 'leaveWaitlist';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: PublishedClass | null;
  subscriptions?: Array<ActiveSubscription>;
  isTrialEligible?: boolean;
  onBookingChange?: () => void | Promise<void>;
}

export function BookingModal({
  isOpen,
  onClose,
  selectedClass,
  subscriptions = [],
  isTrialEligible = false,
  onBookingChange,
}: BookingModalProps) {
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
  const [confirmAction, setConfirmAction] = useState<BookingConfirmAction | null>(null);
  const { response: myBookingsResponse } = usePromise(() => DansshipAPI.bookings.getMyBookings(), isAuthenticated);
  const myBookings = myBookingsResponse?.data ?? [];

  if (!selectedClass) return null;

  const isPast = isPastBookingDeadline(selectedClass.start_time);
  const isCancelled = Boolean(selectedClass.is_cancelled);
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
    const ok = await bookClass({ scheduled_class_id: selectedClass.id });

    if (ok) {
      await onBookingChange?.();
      onClose();
    }
  };

  const handleConfirmCancel = async () => {
    if (!selectedClass.user_booking_id) return;

    const ok = await cancelClass(selectedClass.user_booking_id);

    if (ok) {
      setConfirmAction(null);
      await onBookingChange?.();
      onClose();
    }
  };

  const handleWaitlistJoin = async () => {
    const ok = await joinWaitlist({ scheduled_class_id: selectedClass.id });

    if (ok) {
      await onBookingChange?.();
      onClose();
    }
  };

  const handleConfirmWaitlistCancel = async () => {
    if (!selectedClass.user_booking_id) return;

    const ok = await cancelWaitlist(selectedClass.user_booking_id);

    if (ok) {
      setConfirmAction(null);
      await onBookingChange?.();
      onClose();
    }
  };

  const handleBuyPlan = () => {
    onClose();
    navigate(PageURLS.profile.subscription);
  };

  const handleInstructorClick = () => {
    if (!selectedClass.instructor?.id) return;

    onClose();
    navigate(PageURLS.profile.user(selectedClass.instructor.id));
  };

  const eligibility = getClassBookingEligibility(subscriptions, selectedClass.start_time, isTrialEligible);
  const showSubscriptionWarning =
    eligibility.status === 'no_subscription' &&
    !isBooked &&
    !isWaitlisted &&
    !isPast &&
    !isCancelled &&
    !hasTimeOverlap;
  const showNotStartedWarning =
    eligibility.status === 'not_started' && !isBooked && !isWaitlisted && !isPast && !isCancelled && !hasTimeOverlap;
  const showTrialNote = Boolean(
    eligibility.status === 'trial' && !isBooked && !isWaitlisted && !isPast && !isCancelled,
  );

  return (
    <>
      <AsideModal
        isOpen={isOpen}
        onClose={onClose}
        position='right'
        size='600px'
        contentClassName='p-0 h-full overflow-auto grid grid-rows-[auto_1fr]'
      >
        <img
          src={selectedClass.room?.image_url || DEFAULT_ROOM_IMAGE}
          alt='Room class'
          className='aspect-16/8 object-cover [@media(min-height:1000px)]:aspect-16/10'
        />
        <section className='grid gap-4 grid-rows-[1fr_auto] h-full overflow-auto'>
          <section className='grid gap-4 pt-4 px-8 content-start'>
            <h3 className='text-center text-primary'>
              {selectedClass.class_definition?.name || t('bookings:classDefault')}
            </h3>

            <section
              role={selectedClass.instructor?.id ? 'button' : undefined}
              tabIndex={selectedClass.instructor?.id ? 0 : undefined}
              onClick={selectedClass.instructor?.id ? handleInstructorClick : undefined}
              onKeyDown={
                selectedClass.instructor?.id
                  ? event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleInstructorClick();
                      }
                    }
                  : undefined
              }
              className={cn(
                'bg-secondary/20 px-8 py-8 xs:py-4 rounded-xl grid grid-flow-row xs:grid-flow-col justify-center xs:justify-between gap-4 xs:gap-8 items-center',
                selectedClass.instructor?.id && 'cursor-pointer hover:bg-secondary/30 transition-colors',
              )}
            >
              <section className='grid justify-items-center'>
                <ProfilePicture
                  className='size-20 border-primary border-2'
                  image={selectedClass.instructor?.photo_url || undefined}
                  alt={selectedClass.instructor?.full_name || t('bookings:instructorTBA')}
                  useAuthFallback={false}
                />
              </section>
              <section className='grid content-center text-center xs:text-right'>
                <p className='m-0 font-bold'>{selectedClass.instructor?.full_name || t('bookings:instructorTBA')}</p>
                <label className='m-0 whitespace-nowrap'>{t('bookings:instructor')}</label>
              </section>
            </section>

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
                <p className='m-0 font-bold'>
                  {formatTimeDifference(selectedClass.end_time, selectedClass.start_time)}
                </p>
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
                  {isFull
                    ? `${t('bookings:spotsFull')}`
                    : `${selectedClass.enrolled_count} / ${selectedClass.capacity}`}
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
            {showSubscriptionWarning && (
              <label className='bg-alert-50 p-3 rounded text-alert-800 border border-alert-200'>
                {t('bookings:noSubscriptionWarning')}
              </label>
            )}

            {showNotStartedWarning && eligibility.status === 'not_started' && (
              <label className='bg-alert-50 p-3 rounded text-alert-800 border border-alert-200'>
                {t('bookings:subscriptionNotStartedWarning', {
                  date: format(parseISO(eligibility.startDate), 'd MMM yyyy', { locale }),
                })}
              </label>
            )}

            {showTrialNote && (
              <label className='bg-primary/5 p-3 rounded text-primary border border-primary/20'>
                {t('bookings:trialClassNote')}
              </label>
            )}

            {hasTimeOverlap && !isBooked && !isWaitlisted && (
              <label className='bg-warning-50 p-3 rounded text-warning-800 border border-warning-200'>
                {t('bookings:timeOverlapWarning')}
              </label>
            )}

            <section className='flex flex-col gap-2'>
              {isCancelled ? (
                <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                  {t('bookings:classCancelledMessage')}
                </label>
              ) : isPast ? (
                <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                  {t('bookings:bookingWindowClosed')}
                </label>
              ) : isBooked ? (
                selectedClass.user_booking_is_cancellable === false ? (
                  <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                    {t('bookings:cancellationNotAllowed')}
                  </label>
                ) : (
                  <Button color='alert' onClick={() => setConfirmAction('cancel')} isLoading={isLoading}>
                    {isCancelingClass ? t('bookings:cancelling') : t('bookings:cancelBooking')}
                  </Button>
                )
              ) : isWaitlisted ? (
                <Button
                  color='primary'
                  variant='outlined'
                  onClick={() => setConfirmAction('leaveWaitlist')}
                  isLoading={isLoading}
                >
                  {isCancelingWaitlist ? t('bookings:leaving') : t('bookings:leaveWaitlist')}
                </Button>
              ) : eligibility.status === 'no_subscription' ? (
                <Button color='primary' onClick={handleBuyPlan}>
                  {t('bookings:buyPlan')}
                </Button>
              ) : eligibility.status === 'not_started' ? null : isFull ? (
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

      <ConfirmDialog
        elevated
        open={confirmAction !== null}
        onOpenChange={open => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
        onConfirm={() => {
          if (confirmAction === 'cancel') {
            void handleConfirmCancel();
          } else if (confirmAction === 'leaveWaitlist') {
            void handleConfirmWaitlistCancel();
          }
        }}
        title={confirmAction === 'leaveWaitlist' ? t('bookings:leaveWaitlistTitle') : t('bookings:cancelBookingTitle')}
        description={
          confirmAction === 'leaveWaitlist' ? t('bookings:leaveWaitlistConfirm') : t('bookings:cancelBookingConfirm')
        }
        confirmLabel={
          isLoading
            ? confirmAction === 'leaveWaitlist'
              ? t('bookings:leaving')
              : t('bookings:cancelling')
            : confirmAction === 'leaveWaitlist'
              ? t('bookings:leaveWaitlist')
              : t('bookings:cancelBooking')
        }
        cancelLabel={t('common:keep')}
        confirmVariant='destructive'
        isLoading={isLoading}
      />
    </>
  );
}
