import { format, parseISO } from 'date-fns';
import { toCapitalize } from 'polpo/helpers';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BookingModal } from './booking-modal';

import { Container, SectionEmpty } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { BookingClassCard, BookingDaySelector } from '@components/modules';
import { DansshipAPI, MyBooking, PublishedClass } from '@core/api';
import { BookingDay, getColombiaWeekRangeUtc, getMonday, hasOverlap, sortClassesByDay } from '@helpers';
import { useCallablePromise, useDateLocale } from '@hooks';

interface BookingCalendarProps {
  week: string;
  canBookClasses: boolean;
  isTrialEligible?: boolean;
  myBookings: Array<MyBooking>;
  onBookingChange?: () => void | Promise<void>;
}

export function BookingCalendar({
  week,
  canBookClasses,
  isTrialEligible = false,
  myBookings,
  onBookingChange,
}: BookingCalendarProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [selectedClass, setSelectedClass] = useState<PublishedClass | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [classes, setClasses] = useState<Array<PublishedClass>>([]);
  const [activeDay, setActiveDay] = useState<BookingDay>();
  const [classesByDay, setClassesByDay] = useState<Array<BookingDay>>([]);

  const { call, isLoading, error } = useCallablePromise(async (weekMonday: string) => {
    const { startAt, endAt } = getColombiaWeekRangeUtc(weekMonday);
    const { data: classes } = await DansshipAPI.schedules.getPublishedClassesByRange(startAt, endAt);

    return {
      classes: classes ?? [],
      classesByDay: sortClassesByDay(classes ?? [], weekMonday),
    };
  });

  const refreshClasses = useCallback(
    async (weekMonday: string) => {
      const { classes: nextClasses, classesByDay: nextClassesByDay } = await call(weekMonday);

      setClasses(nextClasses);
      setClassesByDay(nextClassesByDay);
      setActiveDay(previousDay => {
        const sameDay = nextClassesByDay.find(day => day.day === previousDay?.day);

        return sameDay ?? nextClassesByDay.find(day => day.classes.length);
      });
    },
    [call],
  );

  useEffect(() => {
    void refreshClasses(week);
  }, [refreshClasses, week]);

  const handleBookingChange = useCallback(async () => {
    await refreshClasses(week);
    await onBookingChange?.();
  }, [onBookingChange, refreshClasses, week]);

  const handleClassClick = useCallback((cls: PublishedClass) => {
    setSelectedClass(cls);
    setIsModalOpen(true);
  }, []);

  if (isLoading && classes.length === 0) {
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
          <BookingDaySelector
            key={bookingDay.day}
            day={bookingDay.day}
            classes={bookingDay.classes}
            activeDay={activeDay?.day}
            setActiveDay={() => setActiveDay(bookingDay)}
          />
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
        {activeDay?.classes.map((bookingClass, i) => {
          return (
            <section
              key={bookingClass.id}
              className='booking-card transition-all animate-in fade-in slide-in-from-left duration-300 fill-mode-backwards'
              style={{ animationDelay: `${100 * (i + 2)}ms` }}
            >
              <BookingClassCard
                bookingClass={bookingClass}
                hasOverlap={bookingClass => hasOverlap(bookingClass, myBookings)}
                onClick={() => handleClassClick(bookingClass)}
              />
            </section>
          );
        })}
      </section>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedClass={selectedClass}
        canBookClasses={canBookClasses}
        isTrialEligible={isTrialEligible}
        onBookingChange={handleBookingChange}
      />
    </section>
  );
}
