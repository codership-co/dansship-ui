import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router';
import { z } from 'zod';

import { EmailField } from '@components/form-fields';
import { PageURLS } from '@core/constants';

const createVerifyEmailFormSchema = (t: TFunction) =>
  z.object({
    email: z
      .string()
      .min(1, { message: t('validation:required') })
      .email({ message: t('validation:email') }),
  });

export type VerifyEmailFormData = z.infer<ReturnType<typeof createVerifyEmailFormSchema>>;

export enum VerificationStatus {
  IDLE = 'IDLE',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  RESENDING_EMAIL = 'RESENDING_EMAIL',
  RESENDED_EMAIL = 'RESENDED_EMAIL',
  RESENDED_FAILED = 'RESENDED_FAILED',
}

interface VerifyEmailFormProps {
  onSubmit: (values: VerifyEmailFormData) => void;
  status: VerificationStatus;
  isCountDownActive: boolean;
  formattedTime: string;
  email?: string;
}

export const VerifyEmailForm = ({
  onSubmit,
  status,
  isCountDownActive,
  formattedTime,
  email,
}: VerifyEmailFormProps) => {
  const { t } = useTranslation();
  const { control, handleSubmit } = useForm<VerifyEmailFormData>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createVerifyEmailFormSchema(t)),
    defaultValues: {
      email,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='grid gap-4' data-component='VerifyEmailForm'>
      {(![VerificationStatus.VERIFYING, VerificationStatus.VERIFIED].includes(status) || email) && (
        <EmailField
          id='email'
          control={control}
          name='email'
          label={t('auth:verifyEmail.email')}
          placeholder={t('common:placeholder.email')}
          disabled={
            Boolean(email) || [VerificationStatus.RESENDING_EMAIL, VerificationStatus.RESENDED_EMAIL].includes(status)
          }
        />
      )}

      <section className='grid gap-2 mt-4'>
        {[
          VerificationStatus.VERIFICATION_FAILED,
          VerificationStatus.RESENDED_EMAIL,
          VerificationStatus.RESENDED_FAILED,
          VerificationStatus.RESENDING_EMAIL,
          VerificationStatus.IDLE,
        ].includes(status) && (
          <>
            {isCountDownActive && <label className='mb-0 text-center'>{t('auth:verifyEmail.labels.waitResend')}</label>}

            <Button
              fullWidth
              color='primary'
              disabled={isCountDownActive}
              isLoading={status === VerificationStatus.RESENDING_EMAIL}
            >
              {isCountDownActive && <span>{formattedTime}</span>}
              {!isCountDownActive && <span>{t('auth:verifyEmail.resend')}</span>}
            </Button>
          </>
        )}

        <Link to={PageURLS.auth.login} viewTransition>
          {status === VerificationStatus.VERIFIED ? (
            <Button fullWidth color='primary' type='button'>
              <LuArrowRight className='w-4 h-4' />
              {t('auth:verifyEmail.continueToLogin')}
            </Button>
          ) : (
            <Button variant='text' fullWidth color='primary' type='button'>
              <LuArrowLeft className='w-4 h-4' />
              {t('auth:verifyEmail.backToLogin')}
            </Button>
          )}
        </Link>
      </section>
    </form>
  );
};
