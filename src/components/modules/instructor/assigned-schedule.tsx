import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { toCapitalize } from 'polpo/helpers';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCalendar, LuClipboardList, LuClock, LuX } from 'react-icons/lu';

import { WeekSelector } from '../schedules';

import { ClassRoster } from './class-roster';
import { InstructorClassCard } from './instructor-class-card';
import { InstructorEventCard } from './instructor-event-card';
import { InstructorEventRoster } from './instructor-event-roster';

import { Container } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { BookingDaySelector } from '@components/modules/classes/booking-day-selector';
import { Badge, Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { useAuth } from '@contexts';
import {
  DansshipAPI,
  DansshipAPIError,
  DANSSHIP_ERROR_CODE,
  InstructorTeachingUpcomingWeek,
  InstructorTeachingEvent,
  ScheduledClass,
  UpcomingWeekResponse,
} from '@core/api';
import { captureUnexpectedException } from '@core/sentry';
import {
  findNextTeaching,
  getMonday,
  getRelativeTime,
  mergeTeachingWeek,
  resolveActiveTeachingDay,
  resolveTeachingSchedule,
  TeachingDay,
} from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

type SelectedTeaching =
  | { kind: 'class'; scheduledClass: ScheduledClass }
  | { kind: 'event'; event: InstructorTeachingEvent };

function isMissingTeachingProfile(error: unknown): boolean {
  return (
    error instanceof DansshipAPIError &&
    (error.body.error_code === DANSSHIP_ERROR_CODE.SCHEDULE_RESOURCE_NOT_FOUND ||
      error.body.error_code === DANSSHIP_ERROR_CODE.INSTRUCTOR_PROFILE_NOT_FOUND)
  );
}

function getUpcomingStatusKey(
  startTime: string,
  endTime: string,
  now = new Date(),
): 'inProgress' | 'startsIn' | 'todayAt' {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const nowMs = now.getTime();

  if (start <= nowMs && nowMs < end) {
    return 'inProgress';
  }

  const startDate = new Date(startTime);
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
  const [selected, setSelected] = useState<SelectedTeaching | null>(null);
  const [initialClasses, setInitialClasses] = useState<Array<ScheduledClass> | null>(null);
  const [initialEvents, setInitialEvents] = useState<Array<InstructorTeachingEvent> | null>(null);
  const [initialFocusDay, setInitialFocusDay] = useState<string | null>(null);
  const [nearestWeek, setNearestWeek] = useState<string | null>(null);
  const [showJumpedBanner, setShowJumpedBanner] = useState(false);
  const [weekReady, setWeekReady] = useState(!hasInstructorProfile);
  const [lockFocus, setLockFocus] = useState(true);
  const [activeDay, setActiveDay] = useState<TeachingDay>();
  const hasAppliedUpcoming = useRef(false);

  const { response: upcomingResponse, isLoading: isResolvingUpcoming } = usePromise(
    () => DansshipAPI.instructors.getUpcomingWeek(currentWeek),
    hasInstructorProfile,
  );
  const { response: teachingUpcomingResponse, isLoading: isResolvingTeaching } = usePromise(
    () => DansshipAPI.eventos.getTeachingUpcomingWeek(currentWeek),
    hasInstructorProfile,
  );

  const applyResolution = useCallback(
    (
      classPayload: UpcomingWeekResponse | null,
      teachingPayload: InstructorTeachingUpcomingWeek | null,
      options: { lockFocus: boolean },
    ) => {
      const resolution = resolveTeachingSchedule({
        currentWeek,
        classUpcoming: classPayload,
        teachingUpcoming: teachingPayload,
      });

      setWeek(resolution.week);
      setInitialClasses(resolution.classes);
      setInitialEvents(resolution.events);
      setInitialFocusDay(resolution.focusDay);
      setNearestWeek(resolution.week);
      setShowJumpedBanner(resolution.jumped);
      setLockFocus(options.lockFocus);
      setWeekReady(true);
    },
    [currentWeek],
  );

  useEffect(() => {
    if (!hasInstructorProfile) {
      setInitialClasses([]);
      setInitialEvents([]);
      setInitialFocusDay(null);
      setWeekReady(true);

      return;
    }

    if (!upcomingResponse || !teachingUpcomingResponse || hasAppliedUpcoming.current) {
      return;
    }

    hasAppliedUpcoming.current = true;

    if (!upcomingResponse.ok) {
      const error = upcomingResponse.error;

      if (!isMissingTeachingProfile(error)) {
        captureUnexpectedException(error ?? new Error('Instructor upcoming week failed'), {
          tags: { flow: 'instructor.upcoming_week' },
        });
      }
    }

    if (!teachingUpcomingResponse.ok && !isMissingTeachingProfile(teachingUpcomingResponse.error)) {
      captureUnexpectedException(
        teachingUpcomingResponse.error ?? new Error('Instructor teaching upcoming week failed'),
        {
          tags: { flow: 'instructor.teaching_upcoming_week' },
        },
      );
    }

    applyResolution(
      upcomingResponse.ok ? (upcomingResponse.data ?? null) : null,
      teachingUpcomingResponse.ok ? (teachingUpcomingResponse.data ?? null) : null,
      { lockFocus: true },
    );
  }, [applyResolution, hasInstructorProfile, upcomingResponse, teachingUpcomingResponse]);

  const shouldFetchClasses = hasInstructorProfile && weekReady && initialClasses === null;
  const shouldFetchEvents = hasInstructorProfile && weekReady && initialEvents === null;

  const { response: instructorSchedule, isLoading: isLoadingInstructorSchedule } = usePromise(
    () => DansshipAPI.instructors.getInstructorWeeklySchedule(week),
    shouldFetchClasses,
    [week, shouldFetchClasses],
  );
  const { response: teachingWeek, isLoading: isLoadingTeachingWeek } = usePromise(
    () => DansshipAPI.eventos.listTeachingWeek(week),
    shouldFetchEvents,
    [week, shouldFetchEvents],
  );

  const classes = useMemo(() => {
    if (initialClasses !== null) {
      return initialClasses;
    }

    return instructorSchedule?.data ?? [];
  }, [initialClasses, instructorSchedule?.data]);

  const events = useMemo(() => {
    if (initialEvents !== null) {
      return initialEvents;
    }

    return teachingWeek?.data ?? [];
  }, [initialEvents, teachingWeek?.data]);

  const teachingDays = useMemo(() => mergeTeachingWeek(classes, events, week), [classes, events, week]);

  useEffect(() => {
    if (lockFocus) {
      setActiveDay(resolveActiveTeachingDay(teachingDays, undefined, initialFocusDay));

      return;
    }

    setActiveDay(previousDay => resolveActiveTeachingDay(teachingDays, previousDay));
  }, [teachingDays, lockFocus, initialFocusDay]);

  const nextTeaching = useMemo(() => findNextTeaching(classes, events), [classes, events]);
  const nextStart =
    nextTeaching?.kind === 'class' ? nextTeaching.scheduledClass.start_time : nextTeaching?.event.starts_at;
  const nextEnd = nextTeaching?.kind === 'class' ? nextTeaching.scheduledClass.end_time : nextTeaching?.event.ends_at;
  const nextStatus = useMemo(
    () => (nextStart && nextEnd ? getUpcomingStatusKey(nextStart, nextEnd) : null),
    [nextStart, nextEnd],
  );
  const nextRoomName =
    nextTeaching?.kind === 'class' ? nextTeaching.scheduledClass.room?.name : nextTeaching?.event.room?.name;
  const nextName =
    nextTeaching?.kind === 'class'
      ? nextTeaching.scheduledClass.class_definition?.name || t('bookings:classDefault')
      : nextTeaching?.event.name;

  const isLoading =
    hasInstructorProfile &&
    (isResolvingUpcoming ||
      isResolvingTeaching ||
      !weekReady ||
      (shouldFetchClasses && isLoadingInstructorSchedule) ||
      (shouldFetchEvents && isLoadingTeachingWeek));

  const hasTeachingItems = classes.length > 0 || events.length > 0;

  const clearWeekCache = () => {
    setInitialClasses(null);
    setInitialEvents(null);
    setInitialFocusDay(null);
    setLockFocus(false);
    setShowJumpedBanner(false);
  };

  const handleSetWeek = (nextWeek: string) => {
    if (!hasInstructorProfile) return;

    clearWeekCache();
    setWeek(nextWeek);
  };

  const goToCurrentWeek = () => {
    if (!hasInstructorProfile) return;

    clearWeekCache();
    setWeek(currentWeek);
  };

  const goToNextAvailable = async () => {
    if (!hasInstructorProfile) return;

    const [classResult, teachingResult] = await Promise.all([
      DansshipAPI.instructors.getUpcomingWeek(currentWeek),
      DansshipAPI.eventos.getTeachingUpcomingWeek(currentWeek),
    ]);

    if (!classResult.ok && !isMissingTeachingProfile(classResult.error)) {
      captureUnexpectedException(classResult.error ?? new Error('Instructor next available week failed'), {
        tags: { flow: 'instructor.upcoming_week' },
      });
    }

    if (!teachingResult.ok && !isMissingTeachingProfile(teachingResult.error)) {
      captureUnexpectedException(teachingResult.error ?? new Error('Instructor next teaching week failed'), {
        tags: { flow: 'instructor.teaching_upcoming_week' },
      });
    }

    if (!classResult.ok && !teachingResult.ok) {
      return;
    }

    applyResolution(
      classResult.ok ? (classResult.data ?? null) : null,
      teachingResult.ok ? (teachingResult.data ?? null) : null,
      {
        lockFocus: true,
      },
    );
  };

  const openClassRoster = (scheduledClass: ScheduledClass) => setSelected({ kind: 'class', scheduledClass });
  const openEventRoster = (event: InstructorTeachingEvent) => setSelected({ kind: 'event', event });

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

      {!isLoading && nextTeaching && nextStatus && nextStart && nextEnd && (
        <Container>
          <article className='grid gap-4 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:p-6 sm:grid-cols-[1fr_auto] sm:items-center'>
            <div className='grid gap-2'>
              <p className='text-sm font-semibold uppercase tracking-wide text-primary/80 m-0 inline-flex items-center gap-2'>
                {nextTeaching.kind === 'event' ? t('instructor:home.nextEvent') : t('instructor:home.nextClass')}
                {nextTeaching.kind === 'event' && (
                  <Badge variant='default' size='small'>
                    {nextTeaching.event.type_label ?? t('eventos:types.taller')}
                  </Badge>
                )}
              </p>
              <h3 className='m-0 text-primary'>{nextName}</h3>
              <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground'>
                <span className='inline-flex items-center gap-1.5'>
                  <LuClock className='size-4' />
                  {format(new Date(nextStart), 'HH:mm', { locale })} – {format(new Date(nextEnd), 'HH:mm', { locale })}
                </span>
                <span>
                  {nextStatus === 'inProgress' && t('instructor:home.inProgress')}
                  {nextStatus === 'todayAt' &&
                    t('instructor:home.todayAt', {
                      time: format(new Date(nextStart), 'HH:mm', { locale }),
                    })}
                  {nextStatus === 'startsIn' &&
                    t('instructor:home.startsIn', {
                      relative: getRelativeTime(nextStart, i18n.language),
                    })}
                </span>
                {nextRoomName && (
                  <span>
                    {t('schedules:roomLabel', { defaultValue: 'Sala: ' })}
                    {nextRoomName}
                  </span>
                )}
              </div>
            </div>

            <Button
              color='primary'
              size='small'
              onClick={() =>
                nextTeaching.kind === 'class'
                  ? openClassRoster(nextTeaching.scheduledClass)
                  : openEventRoster(nextTeaching.event)
              }
            >
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
        ) : !hasTeachingItems ? (
          <Container>
            <div className='rounded-xl border border-dashed border-secondary p-8 text-center grid gap-2'>
              <p className='m-0 font-medium text-primary'>{t('instructor:home.emptyTitle')}</p>
              <p className='m-0 text-muted-foreground'>{t('instructor:home.emptyDescription')}</p>
            </div>
          </Container>
        ) : (
          <section className='grid gap-8'>
            <section className='grid grid-flow-col sm:gap-4 pb-4 xs:pb-8 overflow-x-auto'>
              {teachingDays.map(teachingDay => (
                <BookingDaySelector
                  key={teachingDay.day}
                  day={teachingDay.day}
                  classes={teachingDay.items}
                  activeDay={activeDay?.day}
                  setActiveDay={() => setActiveDay(teachingDay)}
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
                  <h3 className='m-0 leading-[1em]'>{activeDay.items.length}</h3>
                  <small className='m-0'>
                    {t('bookings:classes', {
                      count: activeDay.items.length,
                    })}
                  </small>
                </section>
              </Container>
            )}

            <section className='grid gap-12 pb-8'>
              {activeDay?.items.map((item, i) => (
                <section
                  key={item.id}
                  className='transition-all animate-in fade-in slide-in-from-left duration-300 fill-mode-backwards'
                  style={{ animationDelay: `${100 * (i + 2)}ms` }}
                >
                  {item.kind === 'class' ? (
                    <InstructorClassCard
                      scheduledClass={item.scheduledClass}
                      highlighted={nextTeaching?.kind === 'class' && item.id === nextTeaching.scheduledClass.id}
                      onClick={() => openClassRoster(item.scheduledClass)}
                    />
                  ) : (
                    <InstructorEventCard
                      event={item.event}
                      highlighted={nextTeaching?.kind === 'event' && item.id === nextTeaching.event.id}
                      onClick={() => openEventRoster(item.event)}
                    />
                  )}
                </section>
              ))}
            </section>
          </section>
        )}

        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className='max-w-[calc(100%-1rem)] sm:max-w-4xl max-h-[92vh] overflow-y-auto p-4 sm:p-6'>
            <DialogTitle>
              {selected?.kind === 'event'
                ? t('instructor:home.eventRosterTitle', { name: selected.event.name })
                : t('schedules:classRoster', {
                    name:
                      selected?.kind === 'class'
                        ? selected.scheduledClass.class_definition?.name || t('bookings:classDefault')
                        : t('bookings:classDefault'),
                  })}
            </DialogTitle>
            <DialogDescription>
              {selected?.kind === 'event'
                ? t('instructor:home.eventRosterDescription')
                : t('schedules:rosterDescription')}
            </DialogDescription>
            {selected?.kind === 'class' && (
              <ClassRoster
                classId={selected.scheduledClass.id}
                className={selected.scheduledClass.class_definition?.name || 'Class'}
                startTime={selected.scheduledClass.start_time}
              />
            )}
            {selected?.kind === 'event' && <InstructorEventRoster eventId={selected.event.id} />}
          </DialogContent>
        </Dialog>
      </section>
    </section>
  );
}
