import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClock } from 'react-icons/lu';

import { Container, Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { BookingCalendar, WeekSelector } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { getMonday } from '@helpers';
import { useNearestWeekWithClasses, usePromise } from '@hooks';

function ClassesPage() {
  const { t } = useTranslation();
  const currentWeek = getMonday(new Date());
  const [week, setWeek] = useState(() => currentWeek);
  const { nearestWeek, isLookingForNearestWeek } = useNearestWeekWithClasses(8);

  const { response: mySubscriptionsResponse, isLoading: isSubLoading } = usePromise(() =>
    DansshipAPI.subscriptions.getMySubscriptions(),
  );
  const totalRemainingClasses = mySubscriptionsResponse?.data?.summary?.total_remaining_classes ?? 0;

  const isLoading = isSubLoading || isLookingForNearestWeek;

  return (
    <Section className='min-h-dvh' navbarPadding footerMargin>
      <SectionHeading title={t('classes:title')} subtitle={t('classes:subtitle')} />

      <section className='grid gap-8'>
        <Container>
          <WeekSelector week={week} setWeek={setWeek} disablePastWeeks>
            <Button
              size='small'
              color='secondary'
              disabled={!nearestWeek || nearestWeek === week}
              variant='flat'
              onClick={() => setWeek(nearestWeek ?? week)}
            >
              <span className='hidden sm:inline'>{t('bookings:nextAvailable')}</span>
              <LuClock className='size-4' />
            </Button>
          </WeekSelector>
        </Container>

        {isLoading && (
          <Container>
            <SpinnerLoader />
          </Container>
        )}

        {!isLoading && <BookingCalendar week={week} hasActiveSubscription={totalRemainingClasses > 0} />}
      </section>
    </Section>
  );
}

export const SecureClassesPage = SecurityGuard(ClassesPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isClassesPageEnabled],
});
