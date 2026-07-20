import { Button } from 'polpo/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { AuthFormLayout } from '@components/layouts';
import { SpinnerLoader } from '@components/loaders';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';

enum InviteStatus {
  IDLE = 'idle',
  ACCEPTING = 'accepting',
  ACCEPTED = 'accepted',
  FAILED = 'failed',
}

function InstructorOnboardingPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<InviteStatus>(InviteStatus.IDLE);
  const [email, setEmail] = useState('');

  const handleAcceptInvite = useCallback(async () => {
    if (!token) {
      setStatus(InviteStatus.FAILED);

      return;
    }

    setStatus(InviteStatus.ACCEPTING);

    try {
      const data = await DansshipAPI.instructors.acceptInvite({ token });

      if (!data.email || !data.accepted) {
        setStatus(InviteStatus.FAILED);
      } else {
        setEmail(data.email);
        setStatus(InviteStatus.ACCEPTED);
      }
    } catch {
      setStatus(InviteStatus.FAILED);
    }
  }, [token]);

  useEffect(() => {
    if (status === InviteStatus.IDLE) {
      void handleAcceptInvite();
    }
  }, [handleAcceptInvite, status]);

  const title = useMemo(() => {
    if (status === InviteStatus.ACCEPTING) {
      return t('auth:instructorOnboarding.titles.accepting');
    }

    if (status === InviteStatus.IDLE) {
      return t('auth:instructorOnboarding.titles.idle');
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

    if (status === InviteStatus.IDLE) {
      return t('auth:instructorOnboarding.subtitles.idle');
    }

    if (status === InviteStatus.FAILED) {
      return t('auth:instructorOnboarding.subtitles.failed');
    }

    return t('auth:instructorOnboarding.subtitles.accepted');
  }, [status, t]);

  return (
    <AuthFormLayout title={title} subtitle={subtitle} dataComponent='InstructorOnboardingPage'>
      {status === InviteStatus.ACCEPTING ? <SpinnerLoader /> : null}

      {[InviteStatus.FAILED, InviteStatus.IDLE].includes(status) && !isAuthenticated && (
        <Link to={PageURLS.auth.login} viewTransition>
          <Button color='primary' className='w-full'>
            {t('auth:instructorOnboarding.backToLogin')}
          </Button>
        </Link>
      )}

      {[InviteStatus.FAILED, InviteStatus.IDLE].includes(status) && isAuthenticated && (
        <Link to={PageURLS.home}>
          <Button color='primary' className='w-full'>
            {t('auth:instructorOnboarding.backToHome')}
          </Button>
        </Link>
      )}

      {status === InviteStatus.ACCEPTED ? (
        <div className='grid gap-6'>
          {isAuthenticated ? (
            <Link to={PageURLS.auth.onboarding} replace>
              <Button color='primary' className='w-full'>
                {t('auth:instructorOnboarding.completeProfile')}
              </Button>
            </Link>
          ) : (
            <Link
              viewTransition
              to={PageURLS.auth.login}
              state={{
                email: email,
                from: {
                  pathname: PageURLS.auth.onboarding,
                },
              }}
            >
              <Button color='primary' className='w-full'>
                {t('auth:instructorOnboarding.completeProfile')}
              </Button>
            </Link>
          )}
        </div>
      ) : null}
    </AuthFormLayout>
  );
}

export const SecureInstructorOnboardingPage = SecurityGuard(InstructorOnboardingPage, {
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled],
});
