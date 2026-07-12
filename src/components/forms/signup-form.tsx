import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';

import { EmailField, PasswordFieldset } from '@components/form-fields';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

const createSignUpSchema = (t: (key: string) => string) =>
  z
    .object({
      email: z
        .string()
        .min(1, { message: t('validation:required') })
        .email({ message: t('validation:email') }),
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

export type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;

export function SignUpForm() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const signUpSchema = createSignUpSchema(t);

  const { control, handleSubmit } = useForm<SignUpFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
    },
  });

  const internalSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    await signUp(data);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(internalSubmit)} className='space-y-6'>
      <EmailField
        id='email'
        control={control}
        name='email'
        label={t('auth:signup.email')}
        placeholder={t('common:placeholder.email')}
      />

      <PasswordFieldset
        control={control}
        passwordName='password'
        confirmPasswordName='confirm_password'
        passwordLabel={t('auth:signup.password.label')}
        confirmPasswordLabel={t('auth:signup.confirmPassword')}
        showStrength
        strengthLabel={t('auth:signup.password.strength')}
        strengthLabels={{
          weak: t('auth:signup.password.weak'),
          good: t('auth:signup.password.good'),
          strong: t('auth:signup.password.strong'),
        }}
      />

      <Button color='primary' type='submit' isLoading={isLoading} fullWidth>
        {t('auth:signup.createAccount')}
      </Button>

      <div className='text-center text-sm'>
        <span className='text-gray-600'>{t('auth:signup.hasAccount')}</span>{' '}
        <Link to={PageURLS.auth.login} viewTransition className='font-medium text-primary hover:text-primary/90'>
          {t('auth:signup.signIn')}
        </Link>
      </div>
    </form>
  );
}
