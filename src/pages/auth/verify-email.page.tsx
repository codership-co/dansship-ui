import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';

import { VerificationStatus, VerifyEmailForm, VerifyEmailFormData } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { useCountdown } from '@hooks';

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
      [VerificationStatus.RESENDED_EMAIL]: t('auth:verifyEmail.subtitles.verificationResended'),
      [VerificationStatus.RESENDED_FAILED]: t('auth:verifyEmail.subtitles.verificationResendFailed'),
    };

    if (verificationStatus in subtitles) {
      return subtitles[verificationStatus as keyof typeof subtitles];
    }

    if (email) {
      return t('auth:verifyEmail.subtitles.idleEmail');
    }

    return t('auth:verifyEmail.subtitles.idle');
  }, [verificationStatus, t, email]);

  const onSubmit = useCallback(
    async ({ email }: VerifyEmailFormData) => {
      reset();
      setVerificationStatus(VerificationStatus.RESENDING_EMAIL);
      try {
        const { data } = await resendVerification({ email });

        if (data?.verification_sent) {
          setVerificationStatus(VerificationStatus.RESENDED_EMAIL);
          start();
        }
      } catch {
      } finally {
        setVerificationStatus(VerificationStatus.RESENDED_FAILED);
      }
    },
    [resendVerification, reset, start],
  );

  return (
    <AuthFormLayout title={statusTitle} subtitle={statusSubTitle}>
      <VerifyEmailForm
        onSubmit={onSubmit}
        status={verificationStatus}
        isCountDownActive={isActive}
        formattedTime={formattedTime}
        email={email}
      />
    </AuthFormLayout>
  );
}

export const SecureVerifyEmailPage = SecurityGuard(VerifyEmailPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isVerifyEmailPageEnabled],
});
