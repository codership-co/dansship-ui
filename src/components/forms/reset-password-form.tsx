import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuKey } from 'react-icons/lu';
import { Link, useLocation } from 'react-router';
import { z } from 'zod';

import { EmailField, PasswordFieldset, TextField } from '@components/form-fields';
import { Button } from '@components/ui';

import type { ResetPasswordPayload } from '@core/api';

const createResetPasswordFormSchema = (t: (key: string) => string) =>
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

interface ResetPasswordFormProps {
  onSubmit: (data: ResetPasswordPayload) => Promise<void>;
  isSubmitting?: boolean;
}

export function ResetPasswordForm({ onSubmit, isSubmitting }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const location = useLocation();

  const resetPasswordSchema = createResetPasswordFormSchema(t);

  const { control, handleSubmit } = useForm<ResetPasswordFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: (location.state as { email?: string } | null)?.email ?? '',
      code: '',
      new_password: '',
      confirm_password: '',
    },
  });

  return (
    <div className='bg-white rounded-lg shadow-sm p-8'>
      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <EmailField
          id='email'
          control={control}
          name='email'
          label={t('auth:resetPassword.email')}
          placeholder={t('common.placeholder.email')}
          disabled={Boolean((location.state as { email?: string } | null)?.email)}
        />

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

        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? t('common.loading') : t('auth:resetPassword.submit')}
        </Button>

        <div className='text-center'>
          <Link to='/auth/login' className='inline-flex items-center gap-1 text-sm text-primary hover:text-primary/90'>
            <LuArrowLeft className='w-4 h-4' />
            {t('auth:resetPassword.backToLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
