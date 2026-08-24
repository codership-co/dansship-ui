import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft } from 'react-icons/lu';
import { Link, useParams } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { StudentProfile } from '@components/modules';
import { Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { InstructorPermissions } from '@core/permissions';
import { captureUnexpectedException } from '@core/sentry';
import { usePromise } from '@hooks';

function InstructorStudentProfilePage() {
  const { t } = useTranslation();
  const { classId = '', userId = '' } = useParams<{ classId: string; userId: string }>();
  const { response, isLoading } = usePromise(
    () => DansshipAPI.instructors.getClassRosterStudentProfile(classId, userId),
    Boolean(classId && userId),
    [classId, userId],
  );

  useEffect(() => {
    if (!response || response.ok) {
      return;
    }

    captureUnexpectedException(response.error ?? new Error('Instructor student profile load failed'), {
      tags: { flow: 'instructor.student_profile.load', class_id: classId, user_id: userId },
    });
  }, [response, classId, userId]);

  const profile = response?.ok ? response.data : null;
  const hasError = Boolean(response && !response.ok);

  return (
    <main className='min-h-dvh grid content-start'>
      <Section navbarPadding verticalPadding>
        <Button asChild variant='ghost' className='mb-4 w-fit px-0 hover:bg-transparent'>
          <Link to={PageURLS.instructor.root} viewTransition>
            <LuChevronLeft className='h-4 w-4' />
            {t('instructor:studentProfile.backToSchedule')}
          </Link>
        </Button>
        <SectionHeading
          title={profile?.full_name || t('instructor:studentProfile.title')}
          subtitle={t('instructor:studentProfile.subtitle')}
        />
        {isLoading && !profile ? (
          <div className='flex justify-center py-12'>
            <SpinnerLoader message={t('instructor:studentProfile.loading')} />
          </div>
        ) : hasError || !profile ? (
          <p className='py-12 text-center text-sm text-muted-foreground'>{t('instructor:studentProfile.notFound')}</p>
        ) : (
          <StudentProfile profile={profile} />
        )}
      </Section>
    </main>
  );
}

export const SecureInstructorStudentProfilePage = SecurityGuard(InstructorStudentProfilePage, {
  requiresAuth: true,
  redirect: PageURLS.auth.login,
  orPermissions: InstructorPermissions.studentProfile,
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isProfilePageEnabled],
});
