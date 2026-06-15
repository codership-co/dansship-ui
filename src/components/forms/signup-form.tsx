import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { z } from 'zod';

import { EmailField, PasswordFieldset } from '@components/form-fields';
import { Button } from '@components/ui';
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
      confirmPassword: z.string().min(1, { message: t('validation:required') }),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: t('validation:password.match'),
      path: ['confirmPassword'],
    });

export type SignUpFormData = z.infer<ReturnType<typeof createSignUpSchema>>;

interface SignUpFormProps {
  onSubmit: (data: SignUpFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function SignUpForm({ onSubmit, isSubmitting }: SignUpFormProps) {
  const { t } = useTranslation();

  const signUpSchema = createSignUpSchema(t);

  const { control, handleSubmit } = useForm<SignUpFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
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
        confirmPasswordName='confirmPassword'
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

      <Button type='submit' disabled={isSubmitting} className='w-full'>
        {isSubmitting ? t('common:loading') : t('auth:signup.createAccount')}
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
