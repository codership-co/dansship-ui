import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuKey } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';

import { EmailField, PasswordFieldset, TextField } from '@components/form-fields';
import { Spinner } from '@components/loaders';
import { Button } from '@components/ui';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';
import { useCountdown } from '@hooks';

import type { ResetPasswordPayload } from '@core/api';

const createResetPasswordFormSchema = (t: TFunction) =>
  z
    .object({
      email: z
        .string()
        .min(1, { message: t('validation:required') })
        .email({ message: t('validation:email') }),
      code: z
        .string()
        .min(1, { message: t('validation:required') })
        .min(6, { message: t('auth:resetPassword.codeInvalid') }),
      new_password: z
        .string()
        .min(1, { message: t('validation:required') })
        .min(8, { message: t('validation:password.length') }),
      confirm_password: z.string().min(1, { message: t('validation:required') }),
    })
    .refine(data => data.new_password === data.confirm_password, {
      message: t('validation:password.match'),
      path: ['confirmPassword'],
    });

export type ResetPasswordFormData = z.infer<ReturnType<typeof createResetPasswordFormSchema>>;

const useResetPasswordForm = (email: string) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { forgotPassword, resetPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [aNewCodeRequested, setANewCodeRequested] = useState(false);
  const { formattedTime, isActive, start, reset } = useCountdown(300);

  const { control, handleSubmit } = useForm<ResetPasswordFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createResetPasswordFormSchema(t)),
    defaultValues: {
      email: email ?? '',
      code: '',
      new_password: '',
      confirm_password: '',
    },
  });

  useEffect(() => {
    if (aNewCodeRequested && !isSendingCode && !isActive) {
      setIsSendingCode(false);
      setANewCodeRequested(false);
    }
  }, [isSendingCode, aNewCodeRequested, isActive]);

  const resendCodeOTP = async () => {
    try {
      reset();
      setIsSendingCode(true);
      setANewCodeRequested(true);
      await forgotPassword({ email });
      setIsSendingCode(false);
      start();
    } catch {}
  };

  const onSubmit = async ({ email, new_password, code }: ResetPasswordPayload) => {
    setIsSubmitting(true);

    try {
      const { error } = await resetPassword({ email, new_password, code });

      if (!error) {
        navigate(PageURLS.auth.login);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Reset password failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isActive,
    isSubmitting,
    isSendingCode,
    formattedTime,
    onSubmit: handleSubmit(onSubmit),
    resendCodeOTP,
    control,
  };
};

interface ResetPasswordFormProps {
  email: string;
}

export function ResetPasswordForm({ email }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const { isActive, isSubmitting, isSendingCode, formattedTime, onSubmit, resendCodeOTP, control } =
    useResetPasswordForm(email);

  return (
    <form onSubmit={onSubmit} className='space-y-6'>
      {!email && (
        <EmailField
          id='email'
          control={control}
          name='email'
          label={t('auth:resetPassword.email')}
          placeholder={t('common:placeholder.email')}
          disabled={Boolean(email)}
        />
      )}

      <TextField
        id='code'
        control={control}
        name='code'
        label={t('auth:resetPassword.code')}
        inputMode='numeric'
        pattern='\d{6}'
        maxLength={6}
        placeholder={t('auth:resetPassword.codePlaceholder')}
        icon={<LuKey className='h-5 w-5 text-gray-400' />}
      />

      <PasswordFieldset
        control={control}
        passwordName='new_password'
        confirmPasswordName='confirm_password'
        passwordLabel={t('auth:resetPassword.newPassword')}
        confirmPasswordLabel={t('auth:resetPassword.confirmPassword')}
        showStrength
        strengthLabel={t('auth:signup.password.strength')}
        strengthLabels={{
          weak: t('auth:signup.password.weak'),
          good: t('auth:signup.password.good'),
          strong: t('auth:signup.password.strong'),
        }}
      />

      <section className='grid gap-2'>
        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting && <Spinner />}
          {!isSubmitting && t('auth:resetPassword.submit')}
        </Button>

        {Boolean(email) && (
          <Button
            className='w-full'
            variant='outlinePrimary'
            type='button'
            onClick={isSendingCode ? undefined : resendCodeOTP}
            disabled={isActive || isSendingCode}
          >
            {isSendingCode && <Spinner />}
            {isActive && !isSendingCode && <span>{formattedTime}</span>}
            {!isSendingCode && !isActive && (
              <>
                <LuKey className='w-4 h-4' />
                {t('auth:resetPassword.sendAgain')}
              </>
            )}
          </Button>
        )}

        <Link to={PageURLS.auth.login} viewTransition>
          <Button variant='ghostPrimary' className='w-full'>
            <LuArrowLeft className='w-4 h-4' />
            {t('auth:resetPassword.backToLogin')}
          </Button>
        </Link>
      </section>
    </form>
  );
}
