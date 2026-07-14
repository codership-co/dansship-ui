import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPI, PublishedClass } from '@core/api';
import { PageURLS } from '@core/constants';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('bookings:classDetails')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='bg-gray-50 p-4 rounded-md border border-gray-200'>
            <h3 className='font-semibold text-gray-900 text-lg'>
              {selectedClass.class_definition?.name || t('bookings:classDefault')}
            </h3>
            <p className='text-gray-600 text-sm mt-1'>{selectedClass.class_definition?.name}</p>
          </div>

          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div>
              <span className='text-gray-500 block'>{t('bookings:dateAndTime')}</span>
              <span className='font-medium text-gray-900'>
                {format(new Date(selectedClass.start_time), 'MMM d, yyyy', { locale })} <br />
                {format(new Date(selectedClass.start_time), 'h:mm a', { locale })} -{' '}
                {format(new Date(selectedClass.end_time), 'h:mm a', { locale })}
              </span>
            </div>
            <div>
              <span className='text-gray-500 block'>{t('bookings:instructor')}</span>
              <span className='font-medium text-gray-900'>
                {selectedClass.instructor?.full_name || t('common:tba')}
              </span>
            </div>
            <div>
              <span className='text-gray-500 block'>{t('bookings:room')}</span>
              <span className='font-medium text-gray-900'>{selectedClass.room?.name || t('common:tba')}</span>
            </div>
            <div>
              <span className='text-gray-500 block'>{t('bookings:capacity')}</span>
              <span className={`font-medium ${isFull ? 'text-alert-600' : 'text-active-600'}`}>
                {selectedClass.enrolled_count} / {selectedClass.capacity} {isFull ? t('bookings:full') : ''}
              </span>
            </div>
          </div>

          {!hasActiveSubscription && !isBooked && !isWaitlisted && (
            <div className='bg-red-50 p-3 rounded text-sm text-alert-800 border border-alert-200'>
              {t('bookings:noSubscriptionWarning')}
            </div>
          )}

          {hasTimeOverlap && !isBooked && !isWaitlisted && (
            <div className='bg-amber-50 p-3 rounded text-sm text-warning-800 border border-warning-200'>
              {t('bookings:timeOverlapWarning')}
            </div>
          )}

          <div className='pt-4 flex flex-col space-y-2'>
            {isBooked ? (
              <Button variant='destructive' onClick={handleCancel} disabled={isLoading}>
                {isCancelingClass ? t('bookings:cancelling') : t('bookings:cancelBooking')}
              </Button>
            ) : isWaitlisted ? (
              <Button variant='outline' onClick={handleWaitlistCancel} disabled={isLoading}>
                {isCancelingWaitlist ? t('bookings:leaving') : t('bookings:leaveWaitlist')}
              </Button>
            ) : !hasActiveSubscription ? (
              <Button onClick={handleBuyPlan}>{t('bookings:buyPlan')}</Button>
            ) : isFull ? (
              <Button onClick={handleWaitlistJoin} disabled={isLoading}>
                {isJoiningWaitlist ? t('bookings:joining') : t('bookings:joinWaitlist')}
              </Button>
            ) : (
              <Button onClick={handleBook} disabled={isLoading}>
                {isBookingClass ? t('bookings:booking') : t('bookings:bookClass')}
              </Button>
            )}

            <Button variant='ghost' onClick={onClose} disabled={isLoading}>
              {t('common:close')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
