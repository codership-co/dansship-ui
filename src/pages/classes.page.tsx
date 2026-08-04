import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClock, LuX } from 'react-icons/lu';

import { Container, Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { BookingCalendar, WeekSelector } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { DansshipAPI, type ActiveSubscription, type PublishedClass } from '@core/api';
import { getMonday } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

function ClassesPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { isAuthenticated } = useAuth();
  const currentWeek = getMonday(new Date());
  const [week, setWeek] = useState(() => currentWeek);
  const [nearestWeek, setNearestWeek] = useState<string | null>(null);
  const [initialClasses, setInitialClasses] = useState<Array<PublishedClass> | null>(null);
  const [showJumpedBanner, setShowJumpedBanner] = useState(false);
  const [weekReady, setWeekReady] = useState(false);
  const hasAppliedUpcoming = useRef(false);

  const { response, isLoading, reFetch } = usePromise(async () => {
    if (!isAuthenticated) {
      const { data: upcoming } = await DansshipAPI.schedules.getUpcomingWeek(currentWeek);

      return {
        upcoming: upcoming ?? null,
        subscriptions: [] as Array<ActiveSubscription>,
        isTrialEligible: false,
        myBookings: [],
      };
    }

    const [{ data: mySubscriptions }, { data: myBookings }, { data: upcoming }] = await Promise.all([
      DansshipAPI.subscriptions.getMySubscriptions(),
      DansshipAPI.bookings.getMyBookings(),
      DansshipAPI.schedules.getUpcomingWeek(currentWeek),
    ]);

    const isTrialEligible = mySubscriptions?.summary?.trial_eligible ?? false;

    return {
      upcoming: upcoming ?? null,
      subscriptions: mySubscriptions?.subscriptions ?? [],
      isTrialEligible,
      myBookings: myBookings ?? [],
    };
  });

  useEffect(() => {
    if (!response || hasAppliedUpcoming.current) {
      return;
    }

    hasAppliedUpcoming.current = true;
    const upcoming = response.upcoming;

    if (upcoming) {
      setWeek(upcoming.resolved_week_start);
      setNearestWeek(upcoming.resolved_week_start);
      setInitialClasses(upcoming.classes);
      setShowJumpedBanner(upcoming.jumped);
    } else {
      setInitialClasses(null);
    }

    setWeekReady(true);
  }, [response]);

  const handleSetWeek = (nextWeek: string) => {
    setInitialClasses(null);
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
    setShowJumpedBanner(data.jumped);
  };

  return (
    <Section className='min-h-dvh' navbarPadding>
      <SectionHeading title={t('classes:title')} subtitle={t('classes:subtitle')} />

      <section className='grid gap-8'>
        {weekReady && (
          <Container>
            <WeekSelector week={week} setWeek={handleSetWeek} disablePastWeeks>
              <Button
                size='small'
                color='secondary'
                disabled={!nearestWeek || nearestWeek === week}
                variant='flat'
                onClick={() => void goToNextAvailable()}
              >
                <span className='hidden sm:inline'>{t('bookings:nextAvailable')}</span>
                <LuClock className='size-4' />
              </Button>
            </WeekSelector>
          </Container>
        )}

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

        {(isLoading && !response) || !weekReady ? (
          <Container>
            <SpinnerLoader />
          </Container>
        ) : (
          response && (
            <BookingCalendar
              week={week}
              initialClasses={initialClasses}
              myBookings={response.myBookings}
              subscriptions={response.subscriptions}
              isTrialEligible={response.isTrialEligible}
              onBookingChange={() => void reFetch()}
            />
          )
        )}
      </section>
    </Section>
  );
}

export const SecureClassesPage = SecurityGuard(ClassesPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isClassesPageEnabled],
});
