import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';

import { EmailField, PasswordField } from '@components/form-fields';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

/*
 * Note: Using i18n directly in schema is tricky since schemas are often defined outside components,
 * but we can generate the schema inside the component or use an error map.
 * Alternatively, we use useTranslation and define schema inside or pass translation hook to schema builder.
 */
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

export function LoginForm() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const loginSchema = createLoginSchema(t);

  const { control, handleSubmit } = useForm<LoginFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const internalSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    await login(data);
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
      />

      <PasswordField
        id='password'
        control={control}
        name='password'
        label={t('auth:login.password')}
        autoComplete='current-password'
        placeholder={t('common:placeholder.password')}
      />

      <div className='flex items-center justify-end'>
        <Link to={PageURLS.auth.forgotPassword} viewTransition className='text-sm text-primary hover:text-primary/90'>
          {t('auth:login.forgotPassword')}
        </Link>
      </div>

      <Button type='submit' isLoading={isLoading} color='primary' className='w-full'>
        {t('auth:login.signIn')}
      </Button>

      <div className='text-center text-sm'>
        <span className='text-gray-600'>{t('auth:login.noAccount')}</span>{' '}
        <Link to={PageURLS.auth.signup} viewTransition className='font-medium text-primary hover:text-primary/90'>
          {t('auth:login.signUp')}
        </Link>
      </div>
    </form>
  );
}
