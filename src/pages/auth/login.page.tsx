import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { LoginForm, type LoginFormData } from '@components/forms';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { getRedirectPathByRole } from '@helpers';

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fromPath = useMemo(() => {
    const locationState = location.state as { from?: Location } | null;

    if (!locationState?.from) {
      return null;
    }

    return `${locationState.from.pathname}${locationState.from.search ?? ''}${locationState.from.hash ?? ''}`;
  }, [location]);

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

  const handleSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

    try {
      await login(data);
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
