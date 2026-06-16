import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { Link, useLocation, useSearchParams } from 'react-router';

import { AuthFormLayout } from '@components/layouts';
import { Spinner, SpinnerLoader } from '@components/loaders';
import { Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { delayPromise } from '@helpers';
import { useCountdown } from '@hooks';

enum VerificationStatus {
  IDLE = 'IDLE',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  RESENDING_EMAIL = 'RESENDING_EMAIL',
  RESENDED_EMAIL = 'RESENDED_EMAIL',
  RESENDED_FAILED = 'RESENDED_FAILED',
}

function VerifyEmailPage() {
  const { t } = useTranslation();
  const { verifyEmail, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();
  const stateEmail: string = state?.email;
  const token = searchParams.get('token');
  const paramEmail = searchParams.get('email');
  const email = stateEmail ?? paramEmail ?? '';

  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(VerificationStatus.IDLE);
  const [isResending, setIsResending] = useState(false);
  const { isActive, start, reset, formattedTime } = useCountdown(120);

  const handleVerification = useCallback(async () => {
    if (!token) return;

    setVerificationStatus(VerificationStatus.VERIFYING);

    try {
      const { data } = await verifyEmail({ token });
      setVerificationStatus(data?.verified ? VerificationStatus.VERIFIED : VerificationStatus.VERIFICATION_FAILED);
    } catch {
      setVerificationStatus(VerificationStatus.VERIFICATION_FAILED);
    }
  }, [verifyEmail, token]);

  useEffect(() => {
    void handleVerification();
  }, [token, handleVerification]);

  const statusTitle = useMemo(() => {
    const titles = {
      [VerificationStatus.VERIFYING]: t('auth:verifyEmail.titles.verifying'),
      [VerificationStatus.VERIFIED]: t('auth:verifyEmail.titles.verified'),
      [VerificationStatus.VERIFICATION_FAILED]: t('auth:verifyEmail.titles.verificationFailed'),
      [VerificationStatus.RESENDING_EMAIL]: t('auth:verifyEmail.titles.resendingVerificationEmail'),
      [VerificationStatus.RESENDED_EMAIL]: t('auth:verifyEmail.titles.verificationResended'),
      [VerificationStatus.RESENDED_FAILED]: t('auth:verifyEmail.titles.verificationResendFailed'),
    };

    if (verificationStatus in titles) {
      return titles[verificationStatus as keyof typeof titles];
    }

    if (email) {
      return t('auth:verifyEmail.titles.idleEmail');
    }

    return t('auth:verifyEmail.titles.idle');
  }, [t, verificationStatus, email]);

  const statusSubTitle = useMemo(() => {
    const subtitles = {
      [VerificationStatus.VERIFYING]: t('auth:verifyEmail.subtitles.verifying'),
      [VerificationStatus.VERIFIED]: t('auth:verifyEmail.subtitles.verified'),
      [VerificationStatus.VERIFICATION_FAILED]: t('auth:verifyEmail.subtitles.verificationFailed'),
      [VerificationStatus.RESENDING_EMAIL]: t('auth:verifyEmail.subtitles.resendingVerificationEmail'),
      [VerificationStatus.RESENDED_EMAIL]: t('auth:verifyEmail.subtitles.verificationResended', {
        email,
      }),
      [VerificationStatus.RESENDED_FAILED]: t('auth:verifyEmail.subtitles.verificationResendFailed', {
        email,
      }),
    };

    if (verificationStatus in subtitles) {
      return subtitles[verificationStatus as keyof typeof subtitles];
    }

    if (email) {
      return t('auth:verifyEmail.subtitles.idleEmail', {
        email: email,
      });
    }

    return t('auth:verifyEmail.subtitles.idle');
  }, [verificationStatus, t, email]);

  const handleResend = async () => {
    setIsResending(true);
    reset();
    setVerificationStatus(VerificationStatus.RESENDING_EMAIL);
    try {
      await delayPromise(resendVerification({ email }), 5000);
      setVerificationStatus(VerificationStatus.RESENDED_EMAIL);
      start();
    } catch {
    } finally {
      setVerificationStatus(VerificationStatus.RESENDED_FAILED);
      setIsResending(false);
    }
  };

  return (
    <AuthFormLayout
      gradientsImage='/assets/images/auth/dancing-girl-3.png'
      title={statusTitle}
      subtitle={statusSubTitle}
    >
      {[VerificationStatus.VERIFYING, VerificationStatus.RESENDING_EMAIL].includes(verificationStatus) && (
        <SpinnerLoader />
      )}

      <section className='grid gap-2 mt-4'>
        {[VerificationStatus.VERIFICATION_FAILED, VerificationStatus.RESENDED_FAILED, VerificationStatus.IDLE].includes(
          verificationStatus,
        ) && (
          <Button className='w-full' onClick={handleResend} disabled={isResending || isActive}>
            {isResending && <Spinner />}
            {!isResending && isActive && <span>{formattedTime}</span>}
            {!isResending && !isActive && <span>{t('auth:verifyEmail.resend')}</span>}
          </Button>
        )}

        <Link to={PageURLS.auth.login} viewTransition>
          {verificationStatus === VerificationStatus.VERIFIED ? (
            <Button className='w-full'>
              <LuArrowRight className='w-4 h-4' />
              {t('auth:verifyEmail.continueToLogin')}
            </Button>
          ) : (
            <Button variant='ghostPrimary' className='w-full'>
              <LuArrowLeft className='w-4 h-4' />
              {t('auth:verifyEmail.backToLogin')}
            </Button>
          )}
        </Link>
      </section>
    </AuthFormLayout>
  );
}

export const SecureVerifyEmailPage = SecurityGuard(VerifyEmailPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isVerifyEmailPageEnabled],
});
