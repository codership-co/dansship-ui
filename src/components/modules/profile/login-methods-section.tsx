import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { PasswordFieldset } from '@components/form-fields';
import { GoogleSignInButton, isGoogleSignInConfigured } from '@components/forms/google-sign-in-button';
import { useAuth } from '@contexts';

const createSetPasswordSchema = (t: (key: string) => string) =>
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

type SetPasswordFormData = z.infer<ReturnType<typeof createSetPasswordSchema>>;

export function LoginMethodsSection() {
  const { t } = useTranslation();
  const { user, setPassword, linkGoogle } = useAuth();
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  const schema = createSetPasswordSchema(t);
  const { control, handleSubmit, reset } = useForm<SetPasswordFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      password: '',
      confirm_password: '',
    },
  });

  if (!user) {
    return null;
  }

  const onSubmitPassword = async (data: SetPasswordFormData) => {
    setIsSavingPassword(true);
    await setPassword(data);
    reset({ password: '', confirm_password: '' });
    setIsSavingPassword(false);
  };

  const onLinkGoogle = async (credential: string) => {
    setIsLinkingGoogle(true);
    await linkGoogle(credential);
    setIsLinkingGoogle(false);
  };

  return (
    <section className='grid gap-4 max-w-[70ch]' data-sentry-mask>
      <div>
        <h3 className='m-0 text-lg font-medium'>{t('profile:loginMethods.title')}</h3>
        <p className='m-0 text-sm text-muted-foreground'>{t('profile:loginMethods.subtitle')}</p>
      </div>

      <div className='grid gap-2'>
        <p className='m-0 font-medium'>{t('profile:loginMethods.password')}</p>
        {user.hasPassword ? (
          <p className='m-0 text-sm text-muted-foreground'>{t('auth:setPassword.hasPassword')}</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmitPassword)} className='grid gap-4'>
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
            <p className='m-0 text-sm text-muted-foreground'>{t('auth:setPassword.subtitle')}</p>
            <Button type='submit' color='primary' isLoading={isSavingPassword} className='w-fit'>
              {t('auth:setPassword.submit')}
            </Button>
          </form>
        )}
      </div>

      <div className='grid gap-2'>
        <p className='m-0 font-medium'>{t('profile:loginMethods.google')}</p>
        {user.hasGoogle ? (
          <p className='m-0 text-sm text-muted-foreground'>{t('auth:google.linked')}</p>
        ) : isGoogleSignInConfigured() ? (
          <GoogleSignInButton
            text='continue_with'
            disabled={isLinkingGoogle}
            onCredential={onLinkGoogle}
            className='w-fit'
          />
        ) : (
          <p className='m-0 text-sm text-muted-foreground'>{t('auth:google.notConfigured')}</p>
        )}
      </div>
    </section>
  );
}
