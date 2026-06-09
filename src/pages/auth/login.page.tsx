import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { LoginForm, type LoginFormData } from '@components/forms';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { getRedirectPathByRole } from '@helpers';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromPath = useMemo(() => {
    const locationState = location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null;

    if (!locationState?.from?.pathname) {
      return null;
    }

    return `${locationState.from.pathname}${locationState.from.search ?? ''}${locationState.from.hash ?? ''}`;
  }, [location]);

  // Redirect to pending actions first, then route-origin, then role default.
  useEffect(() => {
    if (user) {
      if (fromPath && fromPath !== PageURLS.auth.login) {
        navigate(fromPath, { replace: true });

        return;
      }

      const redirectPath = getRedirectPathByRole(user.roles);
      navigate(redirectPath, { replace: true });
    }
  }, [fromPath, navigate, user]);

  const handleSubmit = async ({ email, password }: LoginFormData) => {
    setIsSubmitting(true);

    try {
      await login({ email, password });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>{t('auth:login.title')}</h1>
          <p className='mt-2 text-gray-600'>{t('auth:login.subtitle')}</p>
        </div>

        <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
