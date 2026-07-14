import { Line, Tabs } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import {
  LuBookmark,
  LuMail,
  LuCalendarDays,
  LuShieldCheck,
  LuShield,
  LuUserCheck,
  LuGraduationCap,
} from 'react-icons/lu';
import { Link } from 'react-router';

import { Section } from '@components/containers';
import { SavedFigures, AssignedSchedule, AvailabilityForm, ProfileForm, ProfileHeader } from '@components/modules';
import { Badge, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui';
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
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { response: savedFiguresResponse } = usePromise(() => DansshipAPI.figures.getSavedFigures());
  const hasInstructorPermissions = useOrPermissions([...InstructorPermissions.dashboard, PERMISSION.SCHEDULE_MANAGE]);
  const savedFigures = savedFiguresResponse?.data ?? [];

  if (!user) {
    return <div className='text-center py-12'>{t('profile:notFound')}</div>;
  }

  const normalizedRoles = (user.roles ?? []).map(role => role.toLowerCase());
  const isInstructor = user.isInstructor || user.isCoach;
  const isAdmin = normalizedRoles.includes('admin');
  const isStudent = !user.isInstructor && !user.isCoach && !user.isAdmin;

  const profileBio = user.instructorProfile?.bio || user.bio;
  const profileCompletion = user.profileCompletionPercent ?? 100;
  const isAccountActive = user.isActive ?? true;
  const memberSince = new Date(user.joinDate).toLocaleDateString(i18n.language);
  const lastUpdated = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString(i18n.language) : null;
  const instructorContact = user.instructorProfile?.contactInfo;
  const instructorLastUpdated = user.instructorProfile?.updatedAt
    ? new Date(user.instructorProfile.updatedAt).toLocaleDateString(i18n.language)
    : null;
  const permissions = user.permissions ?? [];

  return (
    <main className='grid gap-20'>
      <ProfileHeader />

      <Section footerMargin>
        <Tabs defaultOpenTab={ProfileTabs.ABOUT}>
          <Tabs.TabList
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

          <section className='pt-10'>
            <Tabs.TabPanel id={ProfileTabs.ABOUT}>
              <Card className='space-y-4'>
                <CardHeader>
                  <CardTitle>{t('profile:about')}</CardTitle>

                  <CardDescription>{t('profile:accountScope')}</CardDescription>
                </CardHeader>

                <CardContent className='space-y-4'>
                  <p className='text-gray-600'>{profileBio || t('profile:noBio')}</p>

                  <div className='grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2'>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <LuMail className='h-4 w-4 text-gray-400' />
                      <span>{user.email}</span>
                    </div>

                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <LuCalendarDays className='h-4 w-4 text-gray-400' />
                      <span>
                        {t('profile:memberSince')} {memberSince}
                      </span>
                    </div>

                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <LuShieldCheck className='h-4 w-4 text-gray-400' />
                      <span>{isAccountActive ? t('common:active') : t('common:inactive')}</span>
                    </div>

                    {lastUpdated && (
                      <div className='flex items-center gap-2 text-sm text-gray-600'>
                        <LuCalendarDays className='h-4 w-4 text-gray-400' />
                        <span>
                          {t('profile:lastUpdated')} {lastUpdated}
                        </span>
                      </div>
                    )}
                  </div>

                  {isStudent && (
                    <div className='space-y-2 rounded-md border border-gray-100 p-4'>
                      <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
                        <LuGraduationCap className='h-4 w-4' />
                        {t('profile:studentSectionTitle')}
                      </div>

                      <p className='text-sm text-gray-600'>{t('profile:studentSectionDescription')}</p>
                    </div>
                  )}

                  {isInstructor && (
                    <div className='space-y-2 rounded-md border border-gray-100 p-4'>
                      <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
                        <LuUserCheck className='h-4 w-4' />
                        {t('instructor:profile.title')}
                      </div>

                      <p className='text-sm text-gray-600'>{t('profile:instructorSectionDescription')}</p>

                      <div className='grid grid-cols-1 gap-3 pt-1 text-sm text-gray-600 sm:grid-cols-2'>
                        <div>
                          <p className='text-xs text-gray-500'>{t('instructor:biography')}</p>
                          <p>{user.instructorProfile?.bio || t('profile:noBio')}</p>
                        </div>

                        <div>
                          <p className='text-xs text-gray-500'>{t('instructor:profile.contactInfoLabel')}</p>
                          <p>{instructorContact || t('profile:notSet')}</p>
                        </div>

                        {instructorLastUpdated && (
                          <div>
                            <p className='text-xs text-gray-500'>{t('profile:lastUpdated')}</p>
                            <p>{instructorLastUpdated}</p>
                          </div>
                        )}

                        <div>
                          <p className='text-xs text-gray-500'>{t('profile:completion')}</p>
                          <p>{user.instructorProfile?.completionPercent ?? profileCompletion}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isAdmin && (
                    <div className='space-y-2 rounded-md border border-gray-100 p-4'>
                      <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
                        <LuShield className='h-4 w-4' />
                        {t('profile:adminSectionTitle')}
                      </div>

                      <p className='text-sm text-gray-600'>{t('profile:adminSectionDescription')}</p>

                      <div className='text-sm text-gray-600'>
                        <span className='font-medium text-gray-900'>{permissions.length}</span>{' '}
                        {t('profile:permissionsCount')}
                      </div>

                      {permissions.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {permissions.slice(0, 8).map(permission => (
                            <Badge key={permission} variant='outline'>
                              {permission}
                            </Badge>
                          ))}

                          {permissions.length > 8 && <Badge variant='outline'>+{permissions.length - 8}</Badge>}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Tabs.TabPanel>
            <Tabs.TabPanel id={ProfileTabs.FIGURES}>
              <Card>
                <CardHeader>
                  <CardTitle className='text-xl font-bold text-gray-900'>{t('profile:stats.savedFigures')}</CardTitle>

                  <CardAction>
                    <Link
                      to='/figure/saved'
                      className='flex items-center gap-2 font-medium text-primary hover:text-primary/90'
                    >
                      <LuBookmark className='h-4 w-4' />
                      {t('common:viewDetails')}
                    </Link>
                  </CardAction>
                </CardHeader>

                <CardContent>
                  <SavedFigures figures={savedFigures} />
                </CardContent>
              </Card>
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

      {hasInstructorPermissions && (
        <Section footerMargin>
          <Line />
          <ProfileForm />
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
