import { Tabs } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { OnboardingStepKey } from '@core/api';

export function ProfileEdit() {
  const { t } = useTranslation();

  return (
    <section className='grid md:grid-cols-[auto_1fr] gap-8 md:items-start'>
      <Tabs defaultOpenTab={OnboardingStepKey.PROFILE}>
        <Tabs.TabList
          color='primary'
          className='md:px-4 md:py-8 grid-flow-row sm:grid-flow-col md:grid-flow-row'
          tabs={[
            { id: OnboardingStepKey.PROFILE, label: t('auth:onboarding.steps.first.title') },
            { id: OnboardingStepKey.HEALTH, label: t('auth:onboarding.steps.second.title') },
            { id: OnboardingStepKey.PREFERENCES, label: t('auth:onboarding.steps.third.title') },
            { id: OnboardingStepKey.OPERATIONAL_PROFILE, label: t('auth:onboarding.instructorSteps.first.title') },
            { id: OnboardingStepKey.CERTIFICATIONS, label: t('auth:onboarding.instructorSteps.second.title') },
          ]}
        />

        <section className='grid gap-8'>
          <Tabs.TabPanel id={OnboardingStepKey.PROFILE}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.first.title')}</h3>
              <p>{t('auth:onboarding.steps.first.subtitle')}</p>

              <p>WIP</p>
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={OnboardingStepKey.HEALTH}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.second.title')}</h3>
              <p>{t('auth:onboarding.steps.second.subtitle')}</p>

              <p>WIP</p>
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={OnboardingStepKey.PREFERENCES}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.third.title')}</h3>
              <p>{t('auth:onboarding.steps.third.subtitle')}</p>

              <p>WIP</p>
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={OnboardingStepKey.OPERATIONAL_PROFILE}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.instructorSteps.first.title')}</h3>
              <p>{t('auth:onboarding.instructorSteps.first.subtitle')}</p>

              <p>WIP</p>
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={OnboardingStepKey.CERTIFICATIONS}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.instructorSteps.second.title')}</h3>
              <p>{t('auth:onboarding.instructorSteps.second.subtitle')}</p>

              <p>WIP</p>
            </section>
          </Tabs.TabPanel>
        </section>
      </Tabs>
    </section>
  );
}
