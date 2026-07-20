import { Accordion, AccordionItem } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuCalendarDays, LuGraduationCap, LuMail, LuShield, LuShieldCheck, LuUserCheck } from 'react-icons/lu';
import { PiCaretLeft } from 'react-icons/pi';

import { Container, SectionHeading } from '@components/containers';
import { Badge } from '@components/ui';
import { useAuth } from '@contexts';
import { formatDateTime } from '@helpers';

export function ProfileAbout() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  if (!user) return null;

  const instructorLastUpdated = user.instructorProfile?.updatedAt
    ? new Date(user.instructorProfile.updatedAt).toLocaleDateString(i18n.language)
    : null;

  return (
    <Container>
      <SectionHeading title={t('profile:profile')} subtitle={t('profile:accountScope')} />

      <section className='grid gap-8'>
        <p className='p-4 border-2 border-solid max-w-[70ch] border-primary/10 rounded-2xl m-0'>
          {user.instructorProfile?.bio || user.bio || t('profile:noBio')}
        </p>

        <div className='grid grid-cols-[repeat(1,auto)] justify-start gap-x-12 gap-y-4 pt-2 sm:grid-cols-[repeat(2,auto)]'>
          <div className='flex items-center gap-4'>
            <LuMail className='size-8' />
            <section className='grid'>
              <p className='m-0'>{user.email}</p>
              <small className='m-0'>{t('common:email')}</small>
            </section>
          </div>

          <div className='flex items-center gap-4'>
            <LuCalendarDays className='size-8' />
            <section className='grid'>
              <p className='m-0'>{formatDateTime(user.joinDate, i18n.language)}</p>
              <small className='m-0'>{t('profile:memberSince')}</small>
            </section>
          </div>

          <div className='flex items-center gap-4'>
            <LuShieldCheck className='size-8' />
            <section className='grid'>
              <p className='m-0'>{user.isActive ? t('common:active') : t('common:inactive')}</p>
              <small className='m-0'>{t('common:status')}</small>
            </section>
          </div>

          {user.updatedAt && (
            <div className='flex items-center gap-4'>
              <LuCalendarDays className='size-8' />
              <section className='grid'>
                <p className='m-0'>{formatDateTime(user.updatedAt, i18n.language)}</p>
                <small className='m-0'>{t('profile:lastUpdated')}</small>
              </section>
            </div>
          )}
        </div>

        <Accordion className='gap-4' noSeparators multiple>
          <AccordionItem
            className='rounded-2xl overflow-hidden'
            classNames={{
              header: 'bg-primary/10 px-8 text-primary',
              body: 'px-8 py-4 border-solid border-2 border-t-0 border-primary/10 rounded-bl-2xl rounded-br-2xl',
            }}
            title={t('profile:studentSectionTitle')}
            startContent={<LuGraduationCap className='size-8' />}
            icon={PiCaretLeft}
            subtitle={t('profile:studentSectionDescription')}
          >
            :D
          </AccordionItem>

          {(user.isCoach || user.isInstructor) && (
            <AccordionItem
              className='rounded-2xl overflow-hidden'
              classNames={{
                header: 'bg-primary/10 px-8 text-primary',
                body: 'px-8 py-4 border-solid border-2 border-t-0 border-primary/10 rounded-bl-2xl rounded-br-2xl',
              }}
              title={t('instructor:profile.title')}
              startContent={<LuUserCheck className='size-8' />}
              icon={PiCaretLeft}
              subtitle={t('profile:instructorSectionDescription')}
            >
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
            </AccordionItem>
          )}

          {user.isAdmin && (
            <AccordionItem
              className='rounded-2xl overflow-hidden'
              classNames={{
                header: 'bg-primary/10 text-primary px-8',
                body: 'px-8 py-4 border-solid border-2 border-t-0 border-primary/10 rounded-bl-2xl rounded-br-2xl',
              }}
              title={t('profile:adminSectionTitle')}
              startContent={<LuShield className='size-8' />}
              icon={PiCaretLeft}
              subtitle={t('profile:adminSectionDescription')}
            >
              <section className='grid gap-4'>
                <label>
                  <span>{user.permissions.length}</span> {t('profile:permissionsCount')}
                </label>

                {user.permissions.length > 0 && (
                  <div className='flex flex-wrap gap-2'>
                    {user.permissions.map(permission => (
                      <Badge key={permission} variant='outline'>
                        {permission}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>
            </AccordionItem>
          )}
        </Accordion>
      </section>
    </Container>
  );
}
