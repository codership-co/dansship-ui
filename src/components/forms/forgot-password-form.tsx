import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
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

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { forgotPassword, error } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const onSubmit = handleSubmit(async data => {
    setIsSubmitting(true);

    try {
      const result = await forgotPassword({
        email: data.email,
      });

      if (result.status === 200) {
        setSubmittedEmail(data.email);
        setIsSubmitted(true);
      }
    } catch (submitError) {
      // eslint-disable-next-line no-console
      console.error('Password reset request failed:', submitError);
    } finally {
      setIsSubmitting(false);
    }
  });

  const handleTryAnother = () => {
    reset({ email: '' });
    clearErrors('email');
    setSubmittedEmail('');
    setIsSubmitted(false);
  };

  if (!isSubmitted) {
    return (
      <form onSubmit={onSubmit} className='space-y-6'>
        <EmailField
          id='email'
          control={control}
          name='email'
          label={t('auth:forgotPassword.email')}
          placeholder={t('common:placeholder.email')}
        />

        {displayError ? <p className='text-sm text-alert-600'>{displayError}</p> : null}

        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? t('common:loading') : t('auth:forgotPassword.sendLink')}
        </Button>

        <div className='text-center'>
          <Link
            to={PageURLS.auth.login}
            viewTransition
            className='inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90'
          >
            <LuArrowLeft className='w-4 h-4' />
            {t('auth:forgotPassword.backToLogin')}
          </Link>
        </div>
      </form>
    );
  }

  return (
    <div className='text-center'>
      <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
        <LuCircleCheck className='h-6 w-6 text-active-600' />
      </div>
      <h3 className='text-lg font-medium text-gray-900 mb-2'>{t('auth:forgotPassword.checkEmail')}</h3>
      <p className='text-sm text-gray-600 mb-6'>
        {t('auth:forgotPassword.instructions')}
        <br />
        <span className='font-medium'>{submittedEmail}</span>
      </p>
      <div className='space-y-4'>
        <Link
          to={PageURLS.auth.resetPassword}
          viewTransition
          state={{ email: submittedEmail }}
          className='w-full inline-flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
        >
          <LuKey className='w-4 h-4' />
          {t('auth:resetPassword.cta')}
        </Link>
        <button
          onClick={handleTryAnother}
          className='w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
        >
          {t('auth:forgotPassword.tryAnother')}
        </button>
        <Link
          to={PageURLS.auth.login}
          viewTransition
          className='inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90'
        >
          <LuArrowLeft className='w-4 h-4' />
          {t('auth:forgotPassword.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
