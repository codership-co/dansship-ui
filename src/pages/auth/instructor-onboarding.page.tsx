import { Button } from 'polpo/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';

import { LoginForm } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { SpinnerLoader } from '@components/loaders';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { DansshipAPI } from '@core/api';
import { FORCE_INSTRUCTOR_ONBOARDING_KEY, PageURLS } from '@core/constants';

enum InviteStatus {
  ACCEPTING = 'accepting',
  ACCEPTED = 'accepted',
  FAILED = 'failed',
}

function InstructorOnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<InviteStatus>(InviteStatus.ACCEPTING);
  const [email, setEmail] = useState('');

  const handleAcceptInvite = useCallback(async () => {
    if (!token) {
      setStatus(InviteStatus.FAILED);

      return;
    }

    setStatus(InviteStatus.ACCEPTING);

    try {
      const data = await DansshipAPI.instructors.acceptInvite({ token });

      if (!data?.email) {
        setStatus(InviteStatus.FAILED);

        return;
      }

      if (data.accepted === false) {
        setStatus(InviteStatus.FAILED);

        return;
      }

      sessionStorage.setItem(FORCE_INSTRUCTOR_ONBOARDING_KEY, '1');
      setEmail(data.email);
      setStatus(InviteStatus.ACCEPTED);
    } catch {
      setStatus(InviteStatus.FAILED);
    }
  }, [token]);

  useEffect(() => {
    void handleAcceptInvite();
  }, [handleAcceptInvite]);

  const goToOnboarding = useCallback(() => {
    sessionStorage.setItem(FORCE_INSTRUCTOR_ONBOARDING_KEY, '1');
    navigate(PageURLS.auth.instructorOnboarding, { replace: true });
  }, [navigate]);

  const title = useMemo(() => {
    if (status === InviteStatus.ACCEPTING) {
      return t('auth:instructorOnboarding.titles.accepting');
    }

    if (status === InviteStatus.FAILED) {
      return t('auth:instructorOnboarding.titles.failed');
    }

    return t('auth:instructorOnboarding.titles.accepted');
  }, [status, t]);

  const subtitle = useMemo(() => {
    if (status === InviteStatus.ACCEPTING) {
      return t('auth:instructorOnboarding.subtitles.accepting');
    }

    if (status === InviteStatus.FAILED) {
      return t('auth:instructorOnboarding.subtitles.failed');
    }

    return t('auth:instructorOnboarding.subtitles.accepted');
  }, [status, t]);

  return (
    <AuthFormLayout title={title} subtitle={subtitle} dataComponent='InstructorOnboardingPage'>
      {status === InviteStatus.ACCEPTING ? <SpinnerLoader /> : null}

      {status === InviteStatus.FAILED ? (
        <Button type='button' color='primary' className='w-full' onClick={() => navigate(PageURLS.auth.login)}>
          {t('auth:instructorOnboarding.backToLogin')}
        </Button>
      ) : null}

      {status === InviteStatus.ACCEPTED ? (
        <div className='grid gap-6'>
          {isAuthenticated ? (
            <Button type='button' color='primary' className='w-full' onClick={goToOnboarding}>
              {t('auth:instructorOnboarding.completeProfile')}
            </Button>
          ) : (
            <LoginForm defaultEmail={email} emailReadOnly hideLinks redirectTo={PageURLS.auth.instructorOnboarding} />
          )}
        </div>
      ) : null}
    </AuthFormLayout>
  );
}

export const SecureInstructorOnboardingPage = SecurityGuard(InstructorOnboardingPage, {
  redirect: PageURLS.home,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isOnboardingPageEnabled],
});
