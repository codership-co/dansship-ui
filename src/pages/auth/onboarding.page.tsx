import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Container, Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { OnboardingInstructorTrack, OnboardingStudentTrack } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { ProfileTrackKey } from '@core/api';
import { PageURLS } from '@core/constants';
import { useOnboarding } from '@hooks';

function OnboardingPage() {
  const { t } = useTranslation();
  const { status, isLoading, currentStep } = useOnboarding();

  if (isLoading && !status) {
    return (
      <Section className='min-h-dvh' navbarPadding footerMargin>
        <Container>
          <SpinnerLoader />
        </Container>
      </Section>
    );
  }

  if (!currentStep?.track || !status?.required) {
    return (
      <Section className='min-h-dvh' navbarPadding footerMargin>
        <SectionHeading
          intro={t('auth:onboarding.completeIntro')}
          title={t('auth:onboarding.completeTitle')}
          subtitle={t('auth:onboarding.completeSubtitle')}
        />
        <Container className='bg-gradient-onboarding grid justify-center gap-25 justify-items-center pt-20 pb-10'>
          <section className='relative size-40 sm:size-60 lg:size-100 bg-accent rounded-full'>
            <img
              src='/assets/images/home/bailarina.png'
              alt='Dansship'
              className='absolute left-1/2 top-1/2 max-w-[initial] w-7/8 -translate-x-1/2 translate-y-[-70%] block'
            />
          </section>

          <section className='flex gap-4 items-center flex-wrap justify-center py-4 px-4 sm:py-8 sm:px-16 bg-white/20 backdrop-blur-xs rounded-2xl'>
            <Link to={PageURLS.home}>
              <Button color='primary' size='small'>
                {t('auth:onboarding:home')}
              </Button>
            </Link>
            <Link to={PageURLS.profile.subscription}>
              <Button color='secondary' size='small'>
                {t('auth:onboarding:subscriptions')}
              </Button>
            </Link>
            <Link to={PageURLS.profile.root}>
              <Button color='tertiary' size='small'>
                {t('auth:onboarding:myProfle')}
              </Button>
            </Link>
            <Link to={PageURLS.classes}>
              <Button color='accent' size='small'>
                {t('auth:onboarding:schedule')}
              </Button>
            </Link>
          </section>
        </Container>
      </Section>
    );
  }

  return (
    <Section className='min-h-dvh' navbarPadding footerMargin>
      {currentStep?.track === ProfileTrackKey.STUDENT && <OnboardingStudentTrack />}
      {currentStep?.track === ProfileTrackKey.INSTRUCTOR && <OnboardingInstructorTrack />}
    </Section>
  );
}

export const SecureOnboardingPage = SecurityGuard(OnboardingPage, {
  redirect: PageURLS.auth.login,
  requiresAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled],
});
