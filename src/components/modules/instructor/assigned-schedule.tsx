import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { toCapitalize } from 'polpo/helpers';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCalendar, LuClipboardList, LuClock, LuX } from 'react-icons/lu';

import { WeekSelector } from '../schedules';

import { ClassRoster } from './class-roster';
import { InstructorClassCard } from './instructor-class-card';

import { Container } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { BookingDaySelector } from '@components/modules/classes/booking-day-selector';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPI, DansshipAPIError, DANSSHIP_ERROR_CODE, ScheduledClass } from '@core/api';
import { captureUnexpectedException } from '@core/sentry';
import { BookingDay, getMonday, getRelativeTime, sortClassesByDay } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

function findNextAssignedClass(classes: Array<ScheduledClass>, now = new Date()): ScheduledClass | null {
  const nowMs = now.getTime();

  const upcoming = classes
    .filter(cls => !cls.is_cancelled && new Date(cls.end_time).getTime() > nowMs)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return upcoming[0] ?? null;
}

function getUpcomingStatusKey(cls: ScheduledClass, now = new Date()): 'inProgress' | 'startsIn' | 'todayAt' {
  const start = new Date(cls.start_time).getTime();
  const end = new Date(cls.end_time).getTime();
  const nowMs = now.getTime();

  if (start <= nowMs && nowMs < end) {
    return 'inProgress';
  }

  const startDate = new Date(cls.start_time);
  const isSameDay =
    startDate.getFullYear() === now.getFullYear() &&
    startDate.getMonth() === now.getMonth() &&
    startDate.getDate() === now.getDate();

  if (isSameDay) {
    return 'todayAt';
  }

  return 'startsIn';
}

export function AssignedSchedule() {
  const { t, i18n } = useTranslation();
  const locale = useDateLocale();
  const { user } = useAuth();
  const hasInstructorProfile = Boolean(user?.hasInstructorProfile ?? user?.isInstructor ?? user?.isCoach);
  const currentWeek = getMonday(new Date());
  const [week, setWeek] = useState(currentWeek);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);
  const [initialClasses, setInitialClasses] = useState<Array<ScheduledClass> | null>(null);
  const [nearestWeek, setNearestWeek] = useState<string | null>(null);
  const [showJumpedBanner, setShowJumpedBanner] = useState(false);
  const [weekReady, setWeekReady] = useState(!hasInstructorProfile);
  const [activeDay, setActiveDay] = useState<BookingDay<ScheduledClass>>();
  const hasAppliedUpcoming = useRef(false);

  const { response: upcomingResponse, isLoading: isResolvingUpcoming } = usePromise(
    () => DansshipAPI.instructors.getUpcomingWeek(currentWeek),
    hasInstructorProfile,
  );

  useEffect(() => {
    if (!hasInstructorProfile) {
      setInitialClasses([]);
      setWeekReady(true);

      return;
    }

    if (!upcomingResponse || hasAppliedUpcoming.current) {
      return;
    }

    hasAppliedUpcoming.current = true;

    if (!upcomingResponse.ok) {
      const error = upcomingResponse.error;
      const isMissingProfile =
        error instanceof DansshipAPIError && error.body.error_code === DANSSHIP_ERROR_CODE.SCHEDULE_RESOURCE_NOT_FOUND;

      if (!isMissingProfile) {
        captureUnexpectedException(error ?? new Error('Instructor upcoming week failed'), {
          tags: { flow: 'instructor.upcoming_week' },
        });
      }

      setInitialClasses([]);
      setWeekReady(true);

      return;
    }

    const upcoming = upcomingResponse.data;

    if (upcoming) {
      setWeek(upcoming.resolved_week_start);
      setInitialClasses(upcoming.classes);
      setNearestWeek(upcoming.resolved_week_start);
      setShowJumpedBanner(upcoming.jumped);
    } else {
      setInitialClasses([]);
    }

    setWeekReady(true);
  }, [hasInstructorProfile, upcomingResponse]);

  const shouldFetchWeek = hasInstructorProfile && weekReady && initialClasses === null;

  const { response: instructorSchedule, isLoading: isLoadingInstructorSchedule } = usePromise(
    () => DansshipAPI.instructors.getInstructorWeeklySchedule(week),
    shouldFetchWeek,
    [week, shouldFetchWeek],
  );

  const classes = useMemo(() => {
    if (initialClasses !== null) {
      return initialClasses;
    }

    return instructorSchedule?.data ?? [];
  }, [initialClasses, instructorSchedule?.data]);

  const classesByDay = useMemo(() => sortClassesByDay(classes, week), [classes, week]);

  useEffect(() => {
    setActiveDay(previousDay => {
      const sameDay = classesByDay.find(day => day.day === previousDay?.day);

      return sameDay ?? classesByDay.find(day => day.classes.length);
    });
  }, [classesByDay]);

  const nextClass = useMemo(() => findNextAssignedClass(classes), [classes]);
  const nextClassStatus = useMemo(() => (nextClass ? getUpcomingStatusKey(nextClass) : null), [nextClass]);

  const isLoading =
    hasInstructorProfile && (isResolvingUpcoming || !weekReady || (shouldFetchWeek && isLoadingInstructorSchedule));

  const openRoster = (cls: ScheduledClass) => setSelectedClass(cls);

  const handleSetWeek = (nextWeek: string) => {
    if (!hasInstructorProfile) return;

    setInitialClasses(null);
    setWeek(nextWeek);
    setShowJumpedBanner(false);
  };

  const goToCurrentWeek = () => {
    if (!hasInstructorProfile) return;

    setInitialClasses(null);
    setWeek(currentWeek);
    setShowJumpedBanner(false);
  };

  const goToNextAvailable = async () => {
    if (!hasInstructorProfile) return;

    const { data, ok, error } = await DansshipAPI.instructors.getUpcomingWeek(currentWeek);

    if (!ok || !data) {
      const isMissingProfile =
        error instanceof DansshipAPIError && error.body.error_code === DANSSHIP_ERROR_CODE.SCHEDULE_RESOURCE_NOT_FOUND;

      if (!isMissingProfile) {
        captureUnexpectedException(error ?? new Error('Instructor next available week failed'), {
          tags: { flow: 'instructor.upcoming_week' },
        });
      }

      return;
    }

    setWeek(data.resolved_week_start);
    setInitialClasses(data.classes);
    setNearestWeek(data.resolved_week_start);
    setShowJumpedBanner(data.jumped);
  };

  return (
    <section className='grid gap-8'>
      {showJumpedBanner && weekReady && (
        <Container>
          <div className='flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary'>
            <p className='m-0 flex-1'>
              {t('instructor:home.jumpedWeekBanner', {
                week: format(parseISO(week), 'd MMM', { locale }),
              })}
            </p>
            <button
              type='button'
              className='shrink-0 rounded p-1 hover:bg-primary/10'
              aria-label={t('instructor:home.dismissBanner')}
              onClick={() => setShowJumpedBanner(false)}
            >
              <LuX className='size-4' />
            </button>
          </div>
        </Container>
      )}

      {!isLoading && nextClass && nextClassStatus && (
        <Container>
          <article className='grid gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6 sm:grid-cols-[1fr_auto] sm:items-center'>
            <div className='grid gap-2'>
              <p className='text-sm font-semibold uppercase tracking-wide text-primary/80 m-0'>
                {t('instructor:home.nextClass')}
              </p>
              <h3 className='m-0 text-primary'>{nextClass.class_definition?.name || t('bookings:classDefault')}</h3>
              <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                <span className='inline-flex items-center gap-1.5'>
                  <LuClock className='size-4' />
                  {format(new Date(nextClass.start_time), 'HH:mm', { locale })} –{' '}
                  {format(new Date(nextClass.end_time), 'HH:mm', { locale })}
                </span>
                <span>
                  {nextClassStatus === 'inProgress' && t('instructor:home.inProgress')}
                  {nextClassStatus === 'todayAt' &&
                    t('instructor:home.todayAt', {
                      time: format(new Date(nextClass.start_time), 'HH:mm', { locale }),
                    })}
                  {nextClassStatus === 'startsIn' &&
                    t('instructor:home.startsIn', {
                      relative: getRelativeTime(nextClass.start_time, i18n.language),
                    })}
                </span>
                {nextClass.room?.name && (
                  <span>
                    {t('schedules:roomLabel', { defaultValue: 'Sala: ' })}
                    {nextClass.room.name}
                  </span>
                )}
              </div>
            </div>

            <Button color='primary' size='small' onClick={() => openRoster(nextClass)}>
              <LuClipboardList className='size-4' />
              {t('instructor:home.viewRoster')}
            </Button>
          </article>
        </Container>
      )}

      {weekReady && hasInstructorProfile && (
        <Container>
          <WeekSelector week={week} setWeek={handleSetWeek}>
            <Button
              size='small'
              color='secondary'
              disabled={!nearestWeek || nearestWeek === week}
              variant='flat'
              onClick={() => void goToNextAvailable()}
            >
              <span className='hidden sm:inline'>{t('instructor:home.nextAvailable')}</span>
              <LuClock className='size-4' />
            </Button>
            <Button
              size='small'
              color='primary'
              disabled={currentWeek === week}
              variant='outlined'
              onClick={goToCurrentWeek}
            >
              <span className='hidden sm:inline'>{t('common:thisWeek')}</span>
              <LuCalendar className='size-4' />
            </Button>
          </WeekSelector>
        </Container>
      )}

      <section className='grid'>
        {isLoading ? (
          <div className='flex justify-center p-12'>
            <SpinnerLoader />
          </div>
        ) : !hasInstructorProfile ? (
          <Container>
            <div className='rounded-xl border border-dashed border-secondary p-8 text-center grid gap-2'>
              <p className='m-0 font-medium text-primary'>{t('instructor:home.noProfileTitle')}</p>
              <p className='m-0 text-muted-foreground'>{t('instructor:home.noProfileDescription')}</p>
            </div>
          </Container>
        ) : classes.length === 0 ? (
          <Container>
            <div className='rounded-xl border border-dashed border-secondary p-8 text-center grid gap-2'>
              <p className='m-0 font-medium text-primary'>{t('instructor:home.emptyTitle')}</p>
              <p className='m-0 text-muted-foreground'>{t('instructor:home.emptyDescription')}</p>
            </div>
          </Container>
        ) : (
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

            <section className='grid gap-12 pb-8'>
              {activeDay?.classes.map((scheduledClass, i) => (
                <section
                  key={scheduledClass.id}
                  className='transition-all animate-in fade-in slide-in-from-left duration-300 fill-mode-backwards'
                  style={{ animationDelay: `${100 * (i + 2)}ms` }}
                >
                  <InstructorClassCard
                    scheduledClass={scheduledClass}
                    highlighted={scheduledClass.id === nextClass?.id}
                    onClick={() => openRoster(scheduledClass)}
                  />
                </section>
              ))}
            </section>
          </section>
        )}

        <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
          <DialogContent className='max-w-[calc(100%-1rem)] sm:max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6'>
            <DialogTitle>
              {t('schedules:classRoster', {
                name: selectedClass?.class_definition?.name || t('bookings:classDefault'),
              })}
            </DialogTitle>
            <DialogDescription>{t('schedules:rosterDescription')}</DialogDescription>
            {selectedClass && (
              <ClassRoster
                classId={selectedClass.id}
                className={selectedClass.class_definition?.name || 'Class'}
                startTime={selectedClass.start_time}
              />
            )}
          </DialogContent>
        </Dialog>
      </section>
    </section>
  );
}
