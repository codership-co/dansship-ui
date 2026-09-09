import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClock, LuX } from 'react-icons/lu';

import { Container, Section, SectionHeading } from '@components/containers';
import { BookingCalendar } from '@components/modules/classes/booking-calendar';
import { ClassesCalendarSkeleton } from '@components/modules/classes/classes-calendar-skeleton';
import { WeekSelector } from '@components/modules/schedules/week-selector';
import { FEATURE_FLAG, SecurityGuard, useAuth, useStudentSession } from '@contexts';
import { DansshipAPI, type PublishedClass } from '@core/api';
import { getMonday } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

function ClassesPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { isAuthenticated, ready } = useAuth();
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

  const { response, reFetch } = usePromise(
    async () => {
      const { data: upcoming } = await DansshipAPI.schedules.getUpcomingWeek(currentWeek);

      return upcoming ?? null;
    },
    ready,
    [isAuthenticated],
  );

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
