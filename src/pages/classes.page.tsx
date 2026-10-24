import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClock, LuX } from 'react-icons/lu';
import { useSearchParams } from 'react-router';

import { Container, Section, SectionHeading } from '@components/containers';
import { BookingCalendar } from '@components/modules/classes/booking-calendar';
import { ClassesCalendarSkeleton } from '@components/modules/classes/classes-calendar-skeleton';
import { WeekSelector } from '@components/modules/schedules/week-selector';
import { FEATURE_FLAG, SecurityGuard, useAuth, useStudentSession } from '@contexts';
import { DansshipAPI, type PublishedClass } from '@core/api';
import { getMonday } from '@helpers';
import { RESUME_REVALIDATE, useDateLocale, usePromise } from '@hooks';

function ClassesPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { isAuthenticated, ready, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { subscriptions, bookings, isTrialEligible, reFetch: reFetchSession } = useStudentSession();
  const currentWeek = getMonday(new Date());
  const [week, setWeek] = useState(() => currentWeek);
  const [nearestWeek, setNearestWeek] = useState<string | null>(null);
  const [initialClasses, setInitialClasses] = useState<Array<PublishedClass> | null>(null);
  const [initialFocusDay, setInitialFocusDay] = useState<string | null>(null);
  const [showJumpedBanner, setShowJumpedBanner] = useState(false);
  const [weekReady, setWeekReady] = useState(false);
  const hasAppliedUpcoming = useRef(false);
  const hasUserChangedWeek = useRef(false);
  const familyEnabled = Boolean(user?.managedUsersEnabled) && !user?.isManaged;
  const { response: familyResponse, error: familyError } = usePromise(
    () => DansshipAPI.family.listMine(),
    familyEnabled,
  );
  const minors = (familyResponse?.data?.minors ?? []).filter(minor => minor.is_active !== false);
  const requestedAttendeeId = searchParams.get('for');
  const [attendeeId, setAttendeeId] = useState<string | null>(requestedAttendeeId);
  const attendeeOptions =
    minors.length > 0 && user
      ? [
          { id: String(user.id), label: t('family:myself') },
          ...minors.map(minor => ({
            id: minor.user_id,
            label: `${minor.full_name}${minor.age !== null ? ` · ${minor.age}` : ''}`,
          })),
        ]
      : [];
  const familySettled = !familyEnabled || familyResponse !== undefined || Boolean(familyError);
  const attendeePending = Boolean(
    familyEnabled && !familySettled && attendeeId && user && attendeeId !== String(user.id),
  );
  const selectedAttendeeId = attendeeOptions.some(option => option.id === attendeeId)
    ? attendeeId
    : !familySettled && attendeeId
      ? attendeeId
      : (attendeeOptions[0]?.id ?? (familyEnabled ? attendeeId : null));
  const selectedAttendee = attendeeOptions.find(option => option.id === selectedAttendeeId);

  const { response, reFetch } = usePromise(
    async () => {
      const { data: upcoming } = await DansshipAPI.schedules.getUpcomingWeek(currentWeek);

      return upcoming ?? null;
    },
    ready,
    [isAuthenticated],
    RESUME_REVALIDATE,
  );

  useEffect(() => {
    setAttendeeId(requestedAttendeeId);
  }, [requestedAttendeeId]);

  useEffect(() => {
    if (!response || hasAppliedUpcoming.current) {
      return;
    }

    hasAppliedUpcoming.current = true;

    if (!hasUserChangedWeek.current) {
      setWeek(response.resolved_week_start);
      setNearestWeek(response.resolved_week_start);
      setInitialClasses(response.classes);
      setInitialFocusDay(response.focus_day);
      setShowJumpedBanner(response.jumped);
    } else {
      setNearestWeek(response.resolved_week_start);
    }

    setWeekReady(true);
  }, [response]);

  const handleSetWeek = (nextWeek: string) => {
    hasUserChangedWeek.current = true;
    setInitialClasses(null);
    setInitialFocusDay(null);
    setWeek(nextWeek);

    if (nextWeek !== nearestWeek) {
      setShowJumpedBanner(false);
    }
  };

  const goToNextAvailable = async () => {
    const { data, ok } = await DansshipAPI.schedules.getUpcomingWeek(currentWeek);

    if (!ok || !data) {
      return;
    }

    setWeek(data.resolved_week_start);
    setNearestWeek(data.resolved_week_start);
    setInitialClasses(data.classes);
    setInitialFocusDay(data.focus_day);
    setShowJumpedBanner(data.jumped);
  };

  return (
    <Section className='min-h-dvh' navbarPadding>
      <SectionHeading title={t('classes:title')} subtitle={t('classes:subtitle')} />

      <section className='grid gap-8'>
        <Container>
          <WeekSelector week={week} setWeek={handleSetWeek} disablePastWeeks>
            <Button
              size='small'
              color='secondary'
              disabled={!weekReady || !nearestWeek || nearestWeek === week}
              variant='flat'
              onClick={() => void goToNextAvailable()}
            >
              <span className='hidden sm:inline'>{t('bookings:nextAvailable')}</span>
              <LuClock className='size-4' />
            </Button>
          </WeekSelector>
        </Container>

        {showJumpedBanner && weekReady && (
          <Container>
            <div className='flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary'>
              <p className='m-0 flex-1'>
                {t('bookings:jumpedWeekBanner', {
                  week: format(parseISO(week), 'd MMM', { locale }),
                })}
              </p>
              <button
                type='button'
                className='shrink-0 rounded p-1 hover:bg-primary/10'
                aria-label={t('bookings:dismissBanner')}
                onClick={() => setShowJumpedBanner(false)}
              >
                <LuX className='size-4' />
              </button>
            </div>
          </Container>
        )}

        {!weekReady ? (
          <div aria-busy='true' aria-label={t('common:loading')}>
            <ClassesCalendarSkeleton />
          </div>
        ) : (
          <BookingCalendar
            week={week}
            initialClasses={initialClasses}
            initialFocusDay={initialFocusDay}
            myBookings={bookings}
            subscriptions={subscriptions}
            isTrialEligible={isTrialEligible}
            attendeeUserId={selectedAttendeeId}
            attendeeName={selectedAttendee?.label ?? null}
            attendeeOptions={attendeeOptions}
            attendeePending={attendeePending}
            onAttendeeChange={nextId => {
              setAttendeeId(nextId);
              const nextParams = new URLSearchParams(searchParams);

              if (user && nextId === String(user.id)) {
                nextParams.delete('for');
              } else {
                nextParams.set('for', nextId);
              }

              setSearchParams(nextParams, { replace: true });
            }}
            onBookingChange={async () => {
              await Promise.all([reFetchSession(), reFetch()]);
            }}
          />
        )}
      </section>
    </Section>
  );
}

export const SecureClassesPage = SecurityGuard(ClassesPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isClassesPageEnabled],
});
