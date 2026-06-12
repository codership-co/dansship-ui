import { format, addDays, parseISO } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router';

import { BookingModal } from './booking-modal';

import { SpinnerLoader } from '@components/loaders';
import { Button } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPI, PublishedClass } from '@core/api';
import { PageURLS } from '@core/constants';
import { useDateLocale, usePromise } from '@hooks';

// Helpers to get current week Monday string
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  return format(new Date(date.setDate(diff)), 'yyyy-MM-dd');
};

const getNextMonday = (mondayStr: string) => {
  return format(addDays(parseISO(mondayStr), 7), 'yyyy-MM-dd');
};

const getPrevMonday = (mondayStr: string) => {
  return format(addDays(parseISO(mondayStr), -7), 'yyyy-MM-dd');
};

export function BookingCalendar() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [selectedClass, setSelectedClass] = useState<PublishedClass | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLocatingWeek, setIsLocatingWeek] = useState(false);
  const [hasSearchedWeek, setHasSearchedWeek] = useState(false);
  const [nearestWeek, setNearestWeek] = useState<string | null>(null);
  const autoSetWeekRef = useRef(false);

  const startAt = `${currentWeek}T00:00:00Z`;
  const endAt = `${getNextMonday(currentWeek)}T00:00:00Z`;
  const { response: mySubscriptionsResponse, isLoading: isSubLoading } = usePromise(
    () => DansshipAPI.subscriptions.getMySubscriptions(),
    isAuthenticated,
  );
  const { response: myBookingsResponse } = usePromise(() => DansshipAPI.bookings.getMyBookings(), isAuthenticated);
  const {
    response: classesResponse,
    isLoading,
    error: isError,
  } = usePromise(() => DansshipAPI.schedules.getPublishedClassesByRange(startAt, endAt), isAuthenticated);
  const myBookings = myBookingsResponse?.data ?? [];
  const classes = classesResponse?.data ?? [];
  const summary = mySubscriptionsResponse?.data?.summary ?? null;

  const redirectToLogin = () => {
    navigate(PageURLS.auth.login, { state: { from: location } });
  };

  useEffect(() => {
    if (autoSetWeekRef.current) {
      return;
    }

    autoSetWeekRef.current = true;

    const findNearestWeekWithClasses = async () => {
      setIsLocatingWeek(true);

      const baseWeek = getMonday(new Date());
      const candidates = Array.from({ length: 8 }, (_, idx) =>
        format(addDays(parseISO(baseWeek), idx * 7), 'yyyy-MM-dd'),
      );

      for (const weekCandidate of candidates) {
        try {
          const candidateStartAt = `${weekCandidate}T00:00:00Z`;
          const candidateEndAt = `${getNextMonday(weekCandidate)}T00:00:00Z`;
          const { data: weekClasses } = await DansshipAPI.schedules.getPublishedClassesByRange(
            candidateStartAt,
            candidateEndAt,
          );

          if (weekClasses && weekClasses.length > 0) {
            setCurrentWeek(weekCandidate);
            setNearestWeek(weekCandidate);
            setHasSearchedWeek(true);
            setIsLocatingWeek(false);

            return;
          }
        } catch {
          continue;
        }
      }

      setHasSearchedWeek(true);
      setIsLocatingWeek(false);
    };

    void findNearestWeekWithClasses();
  }, []);

  const handleClassClick = (cls: PublishedClass) => {
    if (!isAuthenticated) {
      redirectToLogin();

      return;
    }

    // Prevent modal from opening if class overlaps with existing booking
    const isBooked = cls.user_booking_status === 'active';
    const isWaitlisted = cls.user_booking_status === 'waitlisted';

    if (!isBooked && !isWaitlisted && hasOverlap(cls)) {
      return;
    }

    setSelectedClass(cls);
    setIsModalOpen(true);
  };

  const hasActiveSub = (summary?.total_remaining_classes ?? 0) > 0;

  const hasOverlap = (cls: PublishedClass) =>
    myBookings.some(booking => {
      if (!booking.scheduled_class || booking.scheduled_class.id === cls.id) return false;

      if (booking.status === 'cancelled') return false;

      const bookedStart = new Date(booking.scheduled_class.start_time).getTime();
      const bookedEnd = new Date(booking.scheduled_class.end_time).getTime();
      const classStart = new Date(cls.start_time).getTime();
      const classEnd = new Date(cls.end_time).getTime();

      return classStart < bookedEnd && bookedStart < classEnd;
    });

  const classesByDay = classes.reduce<Record<string, Array<PublishedClass>>>((acc, scheduledClass) => {
    const dayKey = format(new Date(scheduledClass.start_time), 'yyyy-MM-dd');

    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }

    acc[dayKey].push(scheduledClass);

    return acc;
  }, {});

  const orderedDays = Object.keys(classesByDay).sort((first, second) => first.localeCompare(second));

  return (
    <div className='space-y-6'>
      <div className='mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4'>
        <Button
          variant='outline'
          size='sm'
          className='px-2 sm:px-4 text-xs sm:text-sm'
          aria-label={t('common:prevWeek')}
          onClick={() => setCurrentWeek(getPrevMonday(currentWeek))}
        >
          <LuChevronLeft className='h-4 w-4' />
          <span className='hidden sm:inline'>{t('common:prevWeek')}</span>
        </Button>
        <div className='font-semibold text-base sm:text-lg text-gray-800 text-center'>
          {t('schedules:weekOf')}
          {format(parseISO(currentWeek), 'MMM d, yyyy', { locale })}
        </div>
        <Button
          variant='outline'
          size='sm'
          className='px-2 sm:px-4 text-xs sm:text-sm'
          aria-label={t('common:nextWeek')}
          onClick={() => setCurrentWeek(getNextMonday(currentWeek))}
        >
          <span className='hidden sm:inline'>{t('common:nextWeek')}</span>
          <LuChevronRight className='h-4 w-4' />
        </Button>
        {nearestWeek && nearestWeek !== currentWeek && (
          <Button variant='secondary' size='sm' onClick={() => setCurrentWeek(nearestWeek)}>
            {t('bookings:nextAvailable')}
          </Button>
        )}
      </div>

      {isLoading || isSubLoading || isLocatingWeek ? (
        <div className='flex justify-center p-12'>
          <SpinnerLoader />
        </div>
      ) : isError ? (
        <div className='rounded-md border border-red-200 bg-red-50 p-4 text-sm text-alert-700'>
          {t('bookings:calendarLoadError')}
        </div>
      ) : classes.length === 0 ? (
        <div className='rounded-md border border-gray-200 bg-gray-50 p-6 text-center'>
          <h3 className='text-lg font-semibold text-gray-900'>
            {parseISO(currentWeek) < new Date(getMonday(new Date()))
              ? t('bookings:weekAlreadyPassed')
              : t('bookings:noClassesThisWeek')}
          </h3>
          <p className='mt-2 text-sm text-gray-600'>
            {parseISO(currentWeek) < new Date(getMonday(new Date()))
              ? t('bookings:weekAlreadyPassedDesc')
              : hasSearchedWeek
                ? t('bookings:noClassesUpcoming')
                : t('bookings:tryAnotherWeek')}
          </p>
        </div>
      ) : (
        <div className='space-y-4'>
          {orderedDays.map(day => (
            <div key={day} className='rounded-lg border border-gray-200 bg-white'>
              <div className='border-b border-gray-100 px-4 py-3'>
                <h3 className='font-semibold text-gray-900'>{format(parseISO(day), 'EEEE, MMM d', { locale })}</h3>
              </div>

              <div className='divide-y divide-gray-100'>
                {classesByDay[day]
                  .sort((first, second) => new Date(first.start_time).getTime() - new Date(second.start_time).getTime())
                  .map(scheduledClass => {
                    const isFull = scheduledClass.enrolled_count >= scheduledClass.capacity;
                    const isBooked = scheduledClass.user_booking_status === 'active';
                    const isWaitlisted = scheduledClass.user_booking_status === 'waitlisted';

                    return (
                      <div
                        key={scheduledClass.id}
                        className='flex flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between cursor-pointer hover:bg-gray-50 transition-colors'
                        onClick={() => handleClassClick(scheduledClass)}
                      >
                        <div>
                          <p className='font-medium text-gray-900'>
                            {scheduledClass.class_definition?.name || t('bookings:classDefault')}
                          </p>
                          <p className='mt-1 text-sm text-gray-600'>
                            {format(new Date(scheduledClass.start_time), 'HH:mm')} -{' '}
                            {format(new Date(scheduledClass.end_time), 'HH:mm')}
                            {' • '}
                            {scheduledClass.instructor?.email || t('bookings:instructorTBA')}
                            {' • '}
                            {scheduledClass.room?.name || t('bookings:roomTBA')}
                          </p>
                          <p className={`mt-1 text-xs font-medium ${isFull ? 'text-alert-600' : 'text-active-600'}`}>
                            {scheduledClass.enrolled_count}/{scheduledClass.capacity} {t('bookings:spots')}
                            {isFull ? ` ${t('bookings:spotsFull')}` : ` ${t('bookings:spotsAvailable')}`}
                          </p>
                          {hasOverlap(scheduledClass) && !isBooked && !isWaitlisted && (
                            <p className='mt-1 text-xs font-medium text-amber-600'>
                              ⚠ {t('bookings:timeOverlapWarning')}
                            </p>
                          )}
                        </div>

                        <Button
                          type='button'
                          onClick={e => {
                            e.stopPropagation();
                            handleClassClick(scheduledClass);
                          }}
                          variant={isBooked || isWaitlisted ? 'outline' : isFull ? 'secondary' : 'default'}
                          className='md:min-w-35'
                          disabled={
                            isBooked || isWaitlisted || (hasOverlap(scheduledClass) && !isBooked && !isWaitlisted)
                          }
                        >
                          {isBooked
                            ? `${t('bookings:booked')} ✓`
                            : isWaitlisted
                              ? t('bookings:status.waitlisted')
                              : isFull
                                ? t('bookings:joinWaitlist')
                                : t('bookings:bookClass')}
                        </Button>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {isAuthenticated && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedClass={selectedClass}
          hasActiveSubscription={hasActiveSub}
        />
      )}
    </div>
  );
}
