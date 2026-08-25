import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuKey } from 'react-icons/lu';
import { Link } from 'react-router';
import { z } from 'zod';

import { EmailField } from '@components/form-fields';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

const createForgotPasswordSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, { message: t('validation:required') })
      .email({ message: t('validation:email') }),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const forgotPasswordSchema = createForgotPasswordSchema(t);

  const {
    control,
    handleSubmit,
    clearErrors,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const emailValue = watch('email');

  useEffect(() => {
    if (errors.email && emailValue) {
      clearErrors('email');
    }
  }, [clearErrors, emailValue, errors.email]);

  const handleInternalSubmit = async (values: ForgotPasswordFormData) => {
    setIsLoading(true);
    await forgotPassword(values);
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(handleInternalSubmit)} className='space-y-4'>
      <EmailField
        id='email'
        control={control}
        name='email'
        label={t('auth:forgotPassword.email')}
        placeholder={t('common:placeholder.email')}
      />

      <section className='grid gap-2'>
        <Button type='submit' isLoading={isLoading} color='primary' fullWidth>
          {t('auth:forgotPassword.sendLink')}
        </Button>

        <Link to={PageURLS.auth.resetPassword} viewTransition>
          <Button fullWidth color='primary' variant='outlined'>
            <LuKey className='w-4 h-4' />
            {t('auth:resetPassword.otpReady')}
          </Button>
        </Link>

        <Link to={PageURLS.auth.login} viewTransition>
          <Button color='primary' variant='text' fullWidth>
            <LuArrowLeft className='w-4 h-4' />
            {t('auth:forgotPassword.backToLogin')}
          </Button>
        </Link>
      </section>
    </form>
  );
}
