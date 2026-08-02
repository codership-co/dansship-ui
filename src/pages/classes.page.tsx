import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClock } from 'react-icons/lu';

import { Container, Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { BookingCalendar, WeekSelector } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { DansshipAPI } from '@core/api';
import { addDaysToFormat, getColombiaWeekRangeUtc, getMonday } from '@helpers';
import { usePromise } from '@hooks';

async function findNearWeekWithClasses(weeksToSearch: number) {
  const baseWeek = getMonday(new Date());

  for (let i = 0; i < weeksToSearch; i++) {
    const weekCandidate = addDaysToFormat(baseWeek, i * 7);
    const { startAt, endAt } = getColombiaWeekRangeUtc(weekCandidate);
    const { data, ok } = await DansshipAPI.schedules.getPublishedClassesByRange(startAt, endAt);

    if (ok && data.length > 0) {
      return weekCandidate;
    }
  }

  return null;
}

function ClassesPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const currentWeek = getMonday(new Date());
  const [week, setWeek] = useState(() => currentWeek);

  const { response, isLoading, reFetch } = usePromise(async () => {
    if (!isAuthenticated) {
      const nearestWeek = await findNearWeekWithClasses(8);

      return {
        nearestWeek,
        canBookClasses: false,
        isTrialEligible: false,
        myBookings: [],
      };
    }

    const [{ data: mySubscriptions }, { data: myBookings }, nearestWeek] = await Promise.all([
      DansshipAPI.subscriptions.getMySubscriptions(),
      DansshipAPI.bookings.getMyBookings(),
      findNearWeekWithClasses(8),
    ]);

    const totalRemainingClasses = mySubscriptions?.summary?.total_remaining_classes ?? 0;
    const totalBonusClasses = mySubscriptions?.summary?.total_bonus_classes ?? 0;
    const isTrialEligible = mySubscriptions?.summary?.trial_eligible ?? false;
    const hasCredits = totalRemainingClasses + totalBonusClasses > 0;

    return {
      nearestWeek,
      canBookClasses: hasCredits || isTrialEligible,
      // Trial is claimed before paid credits on the first booking.
      isTrialEligible,
      myBookings: myBookings ?? [],
    };
  });

  return (
    <Section className='min-h-dvh' navbarPadding>
      <SectionHeading title={t('classes:title')} subtitle={t('classes:subtitle')} />

      <section className='grid gap-8'>
        <Container>
          <WeekSelector week={week} setWeek={setWeek} disablePastWeeks>
            <Button
              size='small'
              color='secondary'
              disabled={!response?.nearestWeek || response?.nearestWeek === week}
              variant='flat'
              onClick={() => setWeek(response?.nearestWeek ?? week)}
            >
              <span className='hidden sm:inline'>{t('bookings:nextAvailable')}</span>
              <LuClock className='size-4' />
            </Button>
          </WeekSelector>
        </Container>

        {isLoading && !response && (
          <Container>
            <SpinnerLoader />
          </Container>
        )}

        {response && (
          <BookingCalendar
            week={week}
            myBookings={response.myBookings}
            canBookClasses={response.canBookClasses}
            isTrialEligible={response.isTrialEligible}
            onBookingChange={() => void reFetch()}
          />
        )}
      </section>
    </Section>
  );
}

export const SecureClassesPage = SecurityGuard(ClassesPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isClassesPageEnabled],
});
