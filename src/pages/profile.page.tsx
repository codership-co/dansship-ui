import { useTranslation } from 'react-i18next';
import {
  LuPencil,
  LuBookmark,
  LuCreditCard,
  LuMail,
  LuCalendarDays,
  LuShieldCheck,
  LuShield,
  LuUserCheck,
  LuGraduationCap,
} from 'react-icons/lu';
import { Link } from 'react-router';

import { SavedFigures } from '@components/modules';
import { Badge, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui';
import { FEATURE_FLAG, useAuth, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

function ProfilePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { response: savedFiguresResponse } = usePromise(() => DansshipAPI.figures.getSavedFigures());
  const { response: mySubscriptionsResponse } = usePromise(() => DansshipAPI.subscriptions.getMySubscriptions());
  const savedFigures = savedFiguresResponse?.data ?? [];
  const summary = mySubscriptionsResponse?.data?.summary ?? null;

  if (!user) {
    return <div className='text-center py-12'>{t('profile:notFound')}</div>;
  }

  const normalizedRoles = (user.roles ?? []).map(role => role.toLowerCase());
  const hasExplicitStudentRole = normalizedRoles.includes('user') || normalizedRoles.includes('student');
  const isInstructor =
    normalizedRoles.includes('instructor') || normalizedRoles.includes('coach') || Boolean(user.isCoach);
  const isAdmin = normalizedRoles.includes('admin');
  const isStudent = hasExplicitStudentRole || (!isInstructor && !isAdmin);

  const profileImage = user.instructorProfile?.photoUrl || user.avatar || 'https://via.placeholder.com/150';
  const profileName = user.displayName || user.fullName || user.name || user.username;
  const profileBio = user.instructorProfile?.bio || user.bio;
  const profileCompletion = user.profileCompletionPercent ?? 100;
  const isAccountActive = user.isActive ?? true;
  const memberSince = new Date(user.joinDate).toLocaleDateString(i18n.language);
  const lastUpdated = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString(i18n.language) : null;
  const roleLabels = user.roles ?? [];
  const instructorContact = user.instructorProfile?.contactInfo;
  const instructorLastUpdated = user.instructorProfile?.updatedAt
    ? new Date(user.instructorProfile.updatedAt).toLocaleDateString(i18n.language)
    : null;
  const permissions = user.permissions ?? [];

  return (
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20'>
      <Card className='mb-8'>
        <CardContent className='p-6'>
          <div className='flex flex-col items-start gap-6 md:flex-row md:items-center'>
            <img src={profileImage} alt={profileName} className='h-24 w-24 rounded-full object-cover' />

            <div className='grow'>
              <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                <div>
                  <h1 className='text-2xl font-bold text-gray-900'>{profileName}</h1>

                  <div className='mt-2 flex flex-wrap gap-2'>
                    {roleLabels.length > 0 ? (
                      roleLabels.map(role => (
                        <Badge key={role} variant='secondary'>
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant='outline'>{t('nav:profile')}</Badge>
                    )}
                  </div>
                </div>

                <div className='flex gap-2'>
                  <Button asChild variant='outline'>
                    <Link to='/my-account/subscription' className='flex items-center gap-2'>
                      <LuCreditCard className='h-4 w-4' />
                      {t('profile:subscriptions')}
                    </Link>
                  </Button>

                  <Button asChild>
                    <Link to='/profile/edit' className='flex items-center gap-2'>
                      <LuPencil className='h-4 w-4' />
                      {t('common:edit')}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className='mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                <div className='rounded-md border border-gray-100 p-3'>
                  <div className='text-xs text-gray-500'>{t('profile:stats.savedFigures')}</div>
                  <div className='text-xl font-semibold text-gray-900'>{savedFigures.length}</div>
                </div>

                <div className='rounded-md border border-gray-100 p-3'>
                  <div className='text-xs text-gray-500'>{t('subscriptions:totalRemaining')}</div>
                  <div className='text-xl font-semibold text-gray-900'>{summary?.total_remaining_classes}</div>
                </div>

                <div className='rounded-md border border-gray-100 p-3'>
                  <div className='text-xs text-gray-500'>{t('subscriptions:activePlans')}</div>
                  <div className='text-xl font-semibold text-gray-900'>{summary?.active_count}</div>
                </div>

                <div className='rounded-md border border-gray-100 p-3'>
                  <div className='text-xs text-gray-500'>{t('profile:completion')}</div>
                  <div className='text-xl font-semibold text-gray-900'>{profileCompletion}%</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8'>
        <div className='lg:col-span-2 space-y-8'>
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
        </div>

        <div className='lg:col-span-1'>
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
        </div>
      </div>
    </main>
  );
}

export const SecureProfilePage = SecurityGuard(ProfilePage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isProfilePageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
