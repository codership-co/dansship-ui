import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { LoginForm, type LoginFormData } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { DANSSHIP_ERROR_CODE } from '@core/api';
import { PageURLS } from '@core/constants';
import { getRedirectPathByRole } from '@helpers';

function LoginPage() {
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
      const { errorData } = await login({ email, password });

      if (errorData?.error_code === DANSSHIP_ERROR_CODE.EMAIL_NOT_VERIFIED) {
        navigate(PageURLS.auth.verifyEmail, { replace: true, state: { email } });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout title={t('auth:login.title')} subtitle={t('auth:login.subtitle')}>
      <LoginForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </AuthFormLayout>
  );
}

export const SecureLoginPage = SecurityGuard(LoginPage, {
  redirect: PageURLS.home,
  requiresNoAuth: true,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled, FEATURE_FLAG.isLoginPageEnabled],
});
