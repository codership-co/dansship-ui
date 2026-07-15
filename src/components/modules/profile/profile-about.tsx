import { useTranslation } from 'react-i18next';
import { LuCalendarDays, LuGraduationCap, LuMail, LuShield, LuShieldCheck, LuUserCheck } from 'react-icons/lu';

import { Container } from '@components/containers';
import { Badge } from '@components/ui';
import { useAuth } from '@contexts';

export function ProfileAbout() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  if (!user) return null;

  const lastUpdated = user.updatedAt ? new Date(user.updatedAt).toLocaleDateString(i18n.language) : null;
  const instructorLastUpdated = user.instructorProfile?.updatedAt
    ? new Date(user.instructorProfile.updatedAt).toLocaleDateString(i18n.language)
    : null;

  return (
    <Container>
      <section>
        <h4>{t('profile:about')}</h4>
        <label>{t('profile:accountScope')}</label>
      </section>

      <section className='grid gap-4'>
        <p className='text-gray-600'>{user.instructorProfile?.bio || user.bio || t('profile:noBio')}</p>

        <div className='grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2'>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <LuMail className='h-4 w-4 text-gray-400' />
            <span>{user.email}</span>
          </div>

          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <LuCalendarDays className='h-4 w-4 text-gray-400' />
            <span>
              {t('profile:memberSince')} {new Date(user.joinDate).toLocaleDateString(i18n.language)}
            </span>
          </div>

          <div className='flex items-center gap-2 text-sm text-gray-600'>
            <LuShieldCheck className='h-4 w-4 text-gray-400' />
            <span>{user.isActive ? t('common:active') : t('common:inactive')}</span>
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

        {!user.isCoach && !user.isInstructor && !user.isAdmin && (
          <div className='space-y-2 rounded-md border border-gray-100 p-4'>
            <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
              <LuGraduationCap className='h-4 w-4' />
              {t('profile:studentSectionTitle')}
            </div>

            <p className='text-sm text-gray-600'>{t('profile:studentSectionDescription')}</p>
          </div>
        )}

        {(user.isCoach || user.isInstructor) && (
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
                <p>{user.instructorProfile?.contactInfo || t('profile:notSet')}</p>
              </div>

              {instructorLastUpdated && (
                <div>
                  <p className='text-xs text-gray-500'>{t('profile:lastUpdated')}</p>
                  <p>{instructorLastUpdated}</p>
                </div>
              )}

              <div>
                <p className='text-xs text-gray-500'>{t('profile:completion')}</p>
                <p>{user.instructorProfile?.completionPercent ?? user.profileCompletionPercent ?? 100}%</p>
              </div>
            </div>
          </div>
        )}

        {user.isAdmin && (
          <div className='space-y-2 rounded-md border border-gray-100 p-4'>
            <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
              <LuShield className='h-4 w-4' />
              {t('profile:adminSectionTitle')}
            </div>

            <p className='text-sm text-gray-600'>{t('profile:adminSectionDescription')}</p>

            <div className='text-sm text-gray-600'>
              <span className='font-medium text-gray-900'>{user.permissions.length}</span>{' '}
              {t('profile:permissionsCount')}
            </div>

            {user.permissions.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {user.permissions.slice(0, 8).map(permission => (
                  <Badge key={permission} variant='outline'>
                    {permission}
                  </Badge>
                ))}

                {user.permissions.length > 8 && <Badge variant='outline'>+{user.permissions.length - 8}</Badge>}
              </div>
            )}
          </div>
        )}
      </section>
    </Container>
  );
}
