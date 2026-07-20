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
  ProfileEditData,
} from '@components/modules';
import { FEATURE_FLAG, useAuth, SecurityGuard, useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { InstructorPermissions, PERMISSION } from '@core/permissions';
import { usePromise } from '@hooks';

enum ProfileTabs {
  ABOUT = 'ABOUT',
  FIGURES = 'FIGURES',
  SCHEDULE = 'SCHEDULE',
  AVAILABILITY = 'AVAILABILITY',
}

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { response: savedFiguresResponse } = usePromise(() => DansshipAPI.figures.getSavedFigures());
  const hasInstructorPermissions = useOrPermissions([...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE]);
  const savedFigures = savedFiguresResponse?.data ?? [];
  const [editMode, setEditMode] = useState(false);
  const [_editableData, setEditableData] = useState<Partial<ProfileEditData>>({});

  if (!user) {
    return <div className='text-center py-12'>{t('profile:notFound')}</div>;
  }

  return (
    <main className='min-h-dvh grid gap-8 md:gap-20 content-start'>
      <ProfileHeader editMode={editMode} onEdit={() => setEditMode(p => !p)} onChange={() => null} />

      {editMode ? (
        <Section footerMargin>
          <ProfileEdit
            showInstructor={user.isCoach || user.isInstructor}
            isLoading={false}
            error=''
            onChange={(key, data) =>
              setEditableData(prev => ({
                ...prev,
                [key]: data,
              }))
            }
          />
        </Section>
      ) : (
        <Section className={cn(editMode && 'hidden')} footerMargin>
          <Tabs defaultOpenTab={ProfileTabs.ABOUT}>
            <Tabs.TabList
              className='overflow-x-auto w-full grid-cols-1 sm:grid-cols-[1fr_1fr] grid-flow-dense md:grid-cols-none md:grid-flow-col'
              color='primary'
              variant='ghost'
              tabs={[
                { id: ProfileTabs.ABOUT, label: t('profile:profile') },
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
