import { format, parseISO } from 'date-fns';
import { toCapitalize } from 'polpo/helpers';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { BookingClassCard } from './booking-class-card';
import { BookingDaySelector } from './booking-day-selector';
import { BookingModal } from './booking-modal';

import { Container, SectionEmpty } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { DansshipAPI, ActiveSubscription, MyBooking, PublishedClass } from '@core/api';
import {
  BookingDay,
  getColombiaWeekRangeUtc,
  getMonday,
  hasOverlap,
  resolveActiveBookingDay,
  sortClassesByDay,
} from '@helpers';
import { useCallablePromise, useDateLocale } from '@hooks';

interface BookingCalendarProps {
  week: string;
  isTrialEligible?: boolean;
  subscriptions?: Array<ActiveSubscription>;
  myBookings: Array<MyBooking>;
  /** When provided, hydrate from these classes and skip the range fetch for this week. */
  initialClasses?: Array<PublishedClass> | null;
  /** Backend focus day (YYYY-MM-DD) from upcoming-week; used for first-paint day selection. */
  initialFocusDay?: string | null;
  onBookingChange?: () => void | Promise<void>;
}

export function BookingCalendar({
  week,
  isTrialEligible = false,
  subscriptions = [],
  myBookings,
  initialClasses = null,
  initialFocusDay = null,
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
      setActiveDay(previousDay => resolveActiveBookingDay(nextClassesByDay, previousDay));
    },
    [call],
  );

  useEffect(() => {
    if (initialClasses !== null) {
      const nextClassesByDay = sortClassesByDay(initialClasses, week);

      setClasses(initialClasses);
      setClassesByDay(nextClassesByDay);
      // Upcoming hydrate owns day focus via backend focus_day; don't keep a prior tab.
      setActiveDay(resolveActiveBookingDay(nextClassesByDay, undefined, { focusDay: initialFocusDay }));

      return;
    }

    void refreshClasses(week);
  }, [initialClasses, initialFocusDay, refreshClasses, week]);

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
        subscriptions={subscriptions}
        isTrialEligible={isTrialEligible}
        onBookingChange={handleBookingChange}
      />
    </section>
  );
}
