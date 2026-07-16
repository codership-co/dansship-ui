import { format, parseISO } from 'date-fns';
import { cn, toCapitalize } from 'polpo/helpers';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BookingModal } from './booking-modal';

import { Container, SectionEmpty } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { BookingClassCard } from '@components/modules';
import { DansshipAPI, MyBooking, PublishedClass } from '@core/api';
import { getMonday, getNextMonday } from '@helpers';
import { useCallablePromise, useDateLocale } from '@hooks';

const hasOverlap = (cls: PublishedClass, myBookings: Array<MyBooking>) =>
  myBookings.some(booking => {
    if (!booking.scheduled_class || booking.scheduled_class.id === cls.id) return false;

    if (booking.status === 'cancelled') return false;

    const bookedStart = new Date(booking.scheduled_class.start_time).getTime();
    const bookedEnd = new Date(booking.scheduled_class.end_time).getTime();
    const classStart = new Date(cls.start_time).getTime();
    const classEnd = new Date(cls.end_time).getTime();

    return classStart < bookedEnd && bookedStart < classEnd;
  });

interface BookingDay {
  day: string;
  classes: Array<PublishedClass>;
}

const sortClassesByDay = (classes: Array<PublishedClass>, startAt: string, endAt: string) => {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const rangeDays: Record<string, Array<PublishedClass>> = {};

  while (start < end) {
    const dateKey = format(start, 'yyyy-MM-dd');
    rangeDays[dateKey] = [];
    start.setDate(start.getDate() + 1);
  }

  const classesByDay = classes.reduce((acc, scheduledClass) => {
    const dayKey = format(new Date(scheduledClass.start_time), 'yyyy-MM-dd');

    if (!acc[dayKey]) {
      acc[dayKey] = [];
    }

    acc[dayKey].push(scheduledClass);

    return acc;
  }, rangeDays);

  const orderedDays = Object.keys(classesByDay).sort((first, second) => first.localeCompare(second));

  return orderedDays.map<BookingDay>(day => ({
    day: day,
    classes: classesByDay[day].sort(
      (first, second) => new Date(first.start_time).getTime() - new Date(second.start_time).getTime(),
    ),
  }));
};

interface BookingCalendarProps {
  week: string;
  hasActiveSubscription: boolean;
}

export function BookingCalendar({ week, hasActiveSubscription }: BookingCalendarProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [selectedClass, setSelectedClass] = useState<PublishedClass | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState<Array<PublishedClass>>([]);
  const [myBookings, setMyBookings] = useState<Array<MyBooking>>([]);
  const [activeDay, setActiveDay] = useState<BookingDay>();
  const [classesByDay, setClassesByDay] = useState<Array<BookingDay>>([]);

  const { call, isLoading, error } = useCallablePromise(async (startAt: string, endAt: string) => {
    const { data: myBookings } = await DansshipAPI.bookings.getMyBookings();
    const { data: classes } = await DansshipAPI.schedules.getPublishedClassesByRange(startAt, endAt);

    return {
      myBookings: myBookings ?? [],
      classes: classes ?? [],
      classesByDay: sortClassesByDay(classes ?? [], startAt, endAt),
    };
  });

  useEffect(() => {
    call(`${week}T00:00:00Z`, `${getNextMonday(week)}T00:00:00Z`).then(({ classes, myBookings, classesByDay }) => {
      setClasses(classes);
      setMyBookings(myBookings);
      setClassesByDay(classesByDay);
      setActiveDay(classesByDay.find(day => day.classes.length));
    });
  }, [call, week]);

  const handleClassClick = useCallback(
    (cls: PublishedClass) => {
      // Prevent modal from opening if class overlaps with existing booking
      const isBooked = cls.user_booking_status === 'active';
      const isWaitlisted = cls.user_booking_status === 'waitlisted';

      if (!isBooked && !isWaitlisted && hasOverlap(cls, myBookings)) {
        return;
      }

      setSelectedClass(cls);
      setIsModalOpen(true);
    },
    [myBookings],
  );

  if (isLoading) {
    return (
      <Container>
        <SpinnerLoader />
      </Container>
    );
  }

  if (error) {
    return <SectionEmpty message={t('bookings:calendarLoadError')} />;
  }

  if (classes.length === 0) {
    return (
      <SectionEmpty
        message={
          parseISO(week) < new Date(getMonday(new Date()))
            ? t('bookings:weekAlreadyPassed')
            : t('bookings:noClassesThisWeek')
        }
        label={
          parseISO(week) < new Date(getMonday(new Date()))
            ? t('bookings:weekAlreadyPassedDesc')
            : t('bookings:noClassesUpcoming')
        }
      />
    );
  }

  return (
    <section className='grid gap-8'>
      <section className='grid grid-flow-col sm:gap-4 pb-4 xs:pb-8 overflow-x-auto'>
        {classesByDay.map(bookingDay => (
          <section
            key={bookingDay.day}
            onClick={bookingDay.classes.length ? () => setActiveDay(bookingDay) : undefined}
            className={cn(
              'flex items-center justify-center text-center py-4 px-2 md:py-8 md:px-4 select-none rounded-2xl transition-all',
              // eslint-disable-next-line quotes
              "relative after:content-[''] after:absolute after:top-full after:opacity-0 after:left-1/2 after:-translate-x-1/2 after:-translate-y-full after:border-t-tertiary/20 after:transition-all after:border-x-transparent",
              bookingDay.classes.length && 'text-accent-700',
              bookingDay.classes.length &&
                activeDay?.day !== bookingDay.day &&
                'hover:bg-tertiary/10 hover:text-primary cursor-pointer',
              !bookingDay.classes.length && 'text-gray-300',
              'after:border-t-10 after:border-x-15',
              'xs:after:border-t-14 xs:after:border-x-22',
              bookingDay.classes.length &&
                activeDay?.day === bookingDay.day &&
                'bg-tertiary/20 text-primary after:translate-y-0 after:opacity-100',
            )}
          >
            <section className='grid lg:border-r lg:border-r-solid lg:pr-2 lg:mr-2'>
              <p className='m-0 font-bold inline-block rotate-90 xs:rotate-0'>
                {toCapitalize(format(parseISO(bookingDay.day), 'EEE', { locale }))}
              </p>
              <span className='m-0 hidden sm:inline-block text-label whitespace-nowrap'>
                {format(parseISO(bookingDay.day), 'MMM d', { locale })}
              </span>
            </section>
            <section className='hidden lg:grid content-center'>
              <h3 className='m-0 leading-[1em]'>{bookingDay.classes.length}</h3>
              <small className='m-0'>
                {t('bookings:classes', {
                  count: bookingDay.classes.length,
                })}
              </small>
            </section>
          </section>
        ))}
      </section>

      {activeDay && (
        <Container className='lg:hidden bg-white/40 py-4 grid grid-flow-col justify-between gap-8 items-center'>
          <section className='grid'>
            <p className='m-0 font-bold'>{toCapitalize(format(parseISO(activeDay.day), 'EEEE', { locale }))}</p>
            <span className='m-0 text-label whitespace-nowrap'>
              {format(parseISO(activeDay.day), 'MMMM d', { locale })}
            </span>
          </section>
          <section className='grid content-center text-center'>
            <h3 className='m-0 leading-[1em]'>{activeDay.classes.length}</h3>
            <small className='m-0'>
              {t('bookings:classes', {
                count: activeDay.classes.length,
              })}
            </small>
          </section>
        </Container>
      )}

      <section className='grid gap-12'>
        {activeDay?.classes.map(bookingClass => {
          return (
            <BookingClassCard
              key={bookingClass.id}
              bookingClass={bookingClass}
              hasOverlap={bookingClass => hasOverlap(bookingClass, myBookings)}
              onClick={() => handleClassClick(bookingClass)}
            />
          );
        })}
      </section>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedClass={selectedClass}
        hasActiveSubscription={hasActiveSubscription}
      />
    </section>
  );
}
