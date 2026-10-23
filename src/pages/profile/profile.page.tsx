import { Tabs } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuBookmark } from 'react-icons/lu';
import { Link } from 'react-router';

import { Container, Section } from '@components/containers';
import {
  SavedFigures,
  AssignedSchedule,
  AvailabilityForm,
  ProfileHeader,
  ProfileAbout,
  ProfileEdit,
  FamilyTab,
} from '@components/modules';
import { FEATURE_FLAG, useAuth, SecurityGuard, useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { InstructorPermissions, PERMISSION } from '@core/permissions';
import { toColombiaDateKey } from '@helpers';
import { usePromise } from '@hooks';

enum ProfileTabs {
  ABOUT = 'ABOUT',
  FAMILY = 'FAMILY',
  FIGURES = 'FIGURES',
  SCHEDULE = 'SCHEDULE',
  AVAILABILITY = 'AVAILABILITY',
}

function ageInColombia(birthDate: string) {
  const [year, month, day] = birthDate.slice(0, 10).split('-').map(Number);
  const today = toColombiaDateKey(new Date()).split('-').map(Number);
  const years = today[0] - year;
  const before = today[1] < month || (today[1] === month && today[2] < day);

  return before ? years - 1 : years;
}

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { response: savedFiguresResponse } = usePromise(() => DansshipAPI.figures.getSavedFigures());
  const { response: agePolicyResponse } = usePromise(() => DansshipAPI.auth.getAgePolicy());
  const adultFrom = agePolicyResponse?.data?.guardian_contact_required_before_age ?? 18;
  const age = user?.birthDate ? ageInColombia(user.birthDate) : null;
  const showFamily = Boolean(user?.managedUsersEnabled) && !user?.isManaged && age !== null && age >= adultFrom;
  const hasInstructorPermissions = useOrPermissions([...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE]);
  const savedFigures = savedFiguresResponse?.data ?? [];
  const [editMode, setEditMode] = useState(false);

  if (!user) {
    return <div className='text-center py-12'>{t('profile:notFound')}</div>;
  }

  return (
    <main className='min-h-dvh grid gap-8 md:gap-20 content-start'>
      <ProfileHeader editMode={editMode} onEdit={() => setEditMode(p => !p)} />

      {editMode ? (
        <Section>
          <ProfileEdit showInstructor={user.isCoach || user.isInstructor} />
        </Section>
      ) : (
        <Section className={cn(editMode && 'hidden')}>
          <Tabs defaultOpenTab={ProfileTabs.ABOUT}>
            <Tabs.TabList
              className='overflow-x-auto w-full grid-cols-1 sm:grid-cols-[1fr_1fr] grid-flow-dense md:grid-cols-none md:grid-flow-col'
              color='primary'
              variant='ghost'
              tabs={[
                { id: ProfileTabs.ABOUT, label: t('profile:profile') },
                ...(showFamily ? [{ id: ProfileTabs.FAMILY, label: t('family:tab') }] : []),
                { id: ProfileTabs.FIGURES, label: t('profile:stats.savedFigures') },
                ...(hasInstructorPermissions
                  ? [
                      {
                        id: ProfileTabs.SCHEDULE,
                        label: t('instructor:dashboard.tabs.roster'),
                      },
                      { id: ProfileTabs.AVAILABILITY, label: t('instructor:dashboard.tabs.availability') },
                    ]
                  : []),
              ]}
            />

            <section className='pt-8'>
              <Tabs.TabPanel id={ProfileTabs.ABOUT}>
                <ProfileAbout />
              </Tabs.TabPanel>

              <Tabs.TabPanel id={ProfileTabs.FAMILY}>
                <FamilyTab />
              </Tabs.TabPanel>

              <Tabs.TabPanel id={ProfileTabs.FIGURES}>
                <Container>
                  <section>
                    <h4>{t('profile:stats.savedFigures')}</h4>

                    <Link
                      to={PageURLS.figureSaved}
                      className='flex items-center gap-2 font-medium text-primary hover:text-primary/90'
                    >
                      <LuBookmark className='h-4 w-4' />
                      {t('common:viewDetails')}
                    </Link>
                  </section>

                  <SavedFigures figures={savedFigures} />
                </Container>
              </Tabs.TabPanel>

              <Tabs.TabPanel id={ProfileTabs.SCHEDULE}>
                <AssignedSchedule />
              </Tabs.TabPanel>

              <Tabs.TabPanel id={ProfileTabs.AVAILABILITY}>
                <AvailabilityForm />
              </Tabs.TabPanel>
            </section>
          </Tabs>
        </Section>
      )}
    </main>
  );
}

export const SecureProfilePage = SecurityGuard(ProfilePage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isProfilePageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
