import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { AssignedSchedule } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { InstructorPermissions, PERMISSION } from '@core/permissions';

function InstructorHomePage() {
  const { t } = useTranslation();

  return (
    <main className='min-h-dvh grid content-start'>
      <Section navbarPadding verticalPadding>
        <SectionHeading title={t('instructor:home.title')} subtitle={t('instructor:home.subtitle')} />
        <AssignedSchedule />
      </Section>
    </main>
  );
}

export const SecureInstructorHomePage = SecurityGuard(InstructorHomePage, {
  requiresAuth: true,
  redirect: PageURLS.auth.login,
  orPermissions: [...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE],
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isProfilePageEnabled],
});
