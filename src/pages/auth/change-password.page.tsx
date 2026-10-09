import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { PasswordFieldset } from '@components/form-fields';
import { AuthFormLayout } from '@components/layouts';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

const createChangePasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      password: z
        .string()
        .min(1, { message: t('validation:required') })
        .min(8, { message: t('validation:password.length') }),
      confirm_password: z.string().min(1, { message: t('validation:required') }),
    })
    .refine(data => data.password === data.confirm_password, {
      message: t('validation:password.match'),
      path: ['confirm_password'],
    });

type ChangePasswordFormData = z.infer<ReturnType<typeof createChangePasswordSchema>>;

function ChangePasswordPage() {
  const { t } = useTranslation();
  const { setPassword } = useAuth();
  const navigate = useNavigate();
  const schema = createChangePasswordSchema(t);
  const { control, handleSubmit } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm_password: '' },
  });

  const onSubmit = handleSubmit(async values => {
    const saved = await setPassword(values);

    if (saved) {
      navigate(PageURLS.home, { replace: true });
    }
  });

  return (
    <AuthFormLayout title={t('auth:changePassword.title')} subtitle={t('auth:changePassword.subtitle')}>
      <form onSubmit={onSubmit} className='grid gap-4' data-sentry-mask>
        <PasswordFieldset
          control={control}
          passwordName='password'
          confirmPasswordName='confirm_password'
          passwordLabel={t('auth:setPassword.title')}
          confirmPasswordLabel={t('auth:signup.confirmPassword')}
          showStrength
          strengthLabel={t('auth:signup.password.strength')}
          strengthLabels={{
            weak: t('auth:signup.password.weak'),
            good: t('auth:signup.password.good'),
            strong: t('auth:signup.password.strong'),
          }}
        />
        <Button type='submit' color='primary'>
          {t('auth:setPassword.submit')}
        </Button>
      </form>
    </AuthFormLayout>
  );
}

export const SecureChangePasswordPage = SecurityGuard(ChangePasswordPage, {
  requiresAuth: true,
  redirect: PageURLS.auth.login,
  featureFlags: [FEATURE_FLAG.areAuthPagesEnabled],
});
