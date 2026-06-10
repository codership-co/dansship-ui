import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { Button } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPIError } from '@core/api';

type VerifyState = 'idle' | 'verifying' | 'verified' | 'failed';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const { verifyEmail, resendVerification } = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email') ?? '';
  const pending = searchParams.get('pending') === '1';

  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState<string>('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const handleVerification = useCallback(
    async (token: string) => {
      if (!token) return;

      setState('verifying');

      try {
        const { data } = await verifyEmail({ token });

        setState(data?.verified ? 'verified' : 'failed');
        setMessage(data?.message ?? '');
      } catch (error) {
        setState('failed');
        setMessage((error as DansshipAPIError)?.message || t('auth:verifyEmail.failed'));
      }
    },
    [t, verifyEmail],
  );

  useEffect(() => {
    if (token) {
      void handleVerification(token);
    }
  }, [token, handleVerification]);

  const statusTitle = useMemo(() => {
    if (state === 'verifying') {
      return t('auth:verifyEmail.verifying');
    }

    if (state === 'verified') {
      return t('auth:verifyEmail.success');
    }

    if (state === 'failed') {
      return t('auth:verifyEmail.failed');
    }

    return pending ? t('auth:verifyEmail.pendingTitle') : t('auth:verifyEmail.title');
  }, [pending, state, t]);

  const handleResend = async () => {
    if (!email || resendCooldown > 0) {
      return;
    }

    setIsResending(true);
    try {
      const response = await resendVerification({ email });
      setMessage(response.data?.message ?? '');
      setResendCooldown(30);
    } catch {
      setMessage(t('auth:verifyEmail.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full bg-white rounded-lg shadow-sm p-8 space-y-4'>
        <h3>{statusTitle}</h3>

        <p className='text-gray-600'>{message || t('auth:verifyEmail.description')}</p>

        {(pending || state === 'failed') && email ? (
          <Button className='w-full' onClick={handleResend} disabled={isResending || resendCooldown > 0}>
            {isResending
              ? t('common.loading')
              : resendCooldown > 0
                ? `${t('auth:verifyEmail.resend')} (${resendCooldown}s)`
                : t('auth:verifyEmail.resend')}
          </Button>
        ) : null}

        {state === 'verified' ? (
          <Button asChild className='w-full'>
            <Link to='/auth/login'>{t('auth:verifyEmail.continueToLogin')}</Link>
          </Button>
        ) : null}

        {state !== 'verified' ? (
          <div className='text-sm text-gray-500'>
            <Link to='/auth/login' className='text-primary hover:text-primary/90'>
              {t('auth:verifyEmail.backToLogin')}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
