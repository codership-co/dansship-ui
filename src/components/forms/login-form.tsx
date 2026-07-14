import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';

import { EmailField, PasswordField } from '@components/form-fields';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

const createLoginSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t('validation:required') })
      .email({ message: t('validation:email') }),
    password: z
      .string()
      .min(1, { message: t('validation:required') })
      .min(8, { message: t('validation:password.length') }),
  });

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

interface LoginFormProps {
  defaultEmail?: string;
  emailReadOnly?: boolean;
  hideLinks?: boolean;
  redirectTo?: string;
  redirectState?: Record<string, unknown>;
}

export function LoginForm({
  defaultEmail = '',
  emailReadOnly = false,
  hideLinks = false,
  redirectTo,
  redirectState,
}: LoginFormProps = {}) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = createLoginSchema(t);

  const { control, handleSubmit, reset } = useForm<LoginFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: defaultEmail,
      password: '',
    },
  });

  useEffect(() => {
    if (!defaultEmail) return;

    reset({
      email: defaultEmail,
      password: '',
    });
  }, [defaultEmail, reset]);

  const internalSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    await login(data, redirectTo ? { redirectTo, redirectState } : undefined);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className='grid gap-6'>
      <EmailField
        id='email'
        control={control}
        name='email'
        label={t('auth:login.email')}
        placeholder={t('common:placeholder.email')}
        disabled={emailReadOnly}
      />

      <PasswordField
        id='password'
        control={control}
        name='password'
        label={t('auth:login.password')}
        autoComplete='current-password'
        placeholder={t('common:placeholder.password')}
      />

      {!hideLinks ? (
        <div className='flex items-center justify-end'>
          <Link to={PageURLS.auth.forgotPassword} viewTransition className='text-sm text-primary hover:text-primary/90'>
            {t('auth:login.forgotPassword')}
          </Link>
        </div>
      ) : null}

      <Button type='submit' isLoading={isLoading} color='primary' className='w-full'>
        {hideLinks ? t('auth:instructorOnboarding.completeProfile') : t('auth:login.signIn')}
      </Button>

      {!hideLinks ? (
        <div className='text-center text-sm'>
          <span className='text-gray-600'>{t('auth:login.noAccount')}</span>{' '}
          <Link to={PageURLS.auth.signup} viewTransition className='font-medium text-primary hover:text-primary/90'>
            {t('auth:login.signUp')}
          </Link>
        </div>
      ) : null}
    </form>
  );
}
