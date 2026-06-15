import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuCircleCheck, LuArrowLeft, LuKey } from 'react-icons/lu';
import { Link } from 'react-router';
import { z } from 'zod';

import { EmailField } from '@components/form-fields';
import { Button } from '@components/ui';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

const createForgotPasswordSchema = (t: (key: string) => string) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t('validation:required') })
      .email({ message: t('validation:email') }),
  });

export type ForgotPasswordFormData = z.infer<ReturnType<typeof createForgotPasswordSchema>>;

interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ForgotPasswordForm({ onSubmit, isSubmitting }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const { error } = useAuth();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const forgotPasswordSchema = createForgotPasswordSchema(t);

  const {
    control,
    handleSubmit,
    clearErrors,
    reset,
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

  const displayError = error || undefined;

  const handleTryAnother = () => {
    reset({ email: '' });
    clearErrors('email');
    setSubmittedEmail('');
    setIsSubmitted(false);
  };

  const handleInternalSubmit = useCallback(
    async (values: ForgotPasswordFormData) => {
      try {
        await onSubmit(values);
        setIsSubmitted(true);
        setSubmittedEmail(values.email);
      } catch {}
    },
    [onSubmit],
  );

  if (!isSubmitted) {
    return (
      <form onSubmit={handleSubmit(handleInternalSubmit)} className='space-y-4'>
        <EmailField
          id='email'
          control={control}
          name='email'
          label={t('auth:forgotPassword.email')}
          placeholder={t('common:placeholder.email')}
        />

        {displayError ? <p className='text-sm text-alert-600'>{displayError}</p> : null}

        <section className='grid gap-2'>
          <Button type='submit' disabled={isSubmitting} className='w-full'>
            {isSubmitting ? t('common:loading') : t('auth:forgotPassword.sendLink')}
          </Button>

          <Link to={PageURLS.auth.resetPassword} viewTransition>
            <Button className='w-full' variant='outlinePrimary'>
              <LuKey className='w-4 h-4' />
              {t('auth:resetPassword.otpReady')}
            </Button>
          </Link>

          <Link to={PageURLS.auth.login} viewTransition>
            <Button variant='ghostPrimary' className='w-full'>
              <LuArrowLeft className='w-4 h-4' />
              {t('auth:forgotPassword.backToLogin')}
            </Button>
          </Link>
        </section>
      </form>
    );
  }

  return (
    <div className='text-center'>
      <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
        <LuCircleCheck className='h-6 w-6 text-active-600' />
      </div>
      <div className='grid gap-4'>
        <Link to={PageURLS.auth.resetPassword} state={{ email: submittedEmail }} viewTransition>
          <Button className='w-full'>
            <LuKey className='w-4 h-4' />
            {t('auth:resetPassword.cta')}
          </Button>
        </Link>
        <Button variant='outlinePrimary' onClick={handleTryAnother}>
          {t('auth:forgotPassword.tryAnother')}
        </Button>
        <Link to={PageURLS.auth.login} viewTransition>
          <Button variant='ghostPrimary' className='w-full'>
            <LuArrowLeft className='w-4 h-4' />
            {t('auth:forgotPassword.backToLogin')}
          </Button>
        </Link>
      </div>
    </div>
  );
}
