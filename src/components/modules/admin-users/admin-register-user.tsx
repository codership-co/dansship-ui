import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { toHealthPayload, toPreferencesPayload, toProfilePayload } from './admin-user-profile';
import { TemporaryPasswordPanel } from './temporary-password-panel';

import { BasicProfileForm, HealthProfileForm, PreferencesProfileForm } from '@components/forms';
import { Button, Input, Label } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI, DansshipAPIError } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

import type { BasicProfileFormValues } from '@components/forms/basic-profile-form';
import type { HealthDataFormValues } from '@components/forms/health-profile-form';
import type { PreferencesProfileFormValues } from '@components/forms/preferences-profile-form';
import type { AdminRegisterUserResponse } from '@core/api/users/users.models';

type Step = 'email' | 'profile' | 'health' | 'preferences' | 'done';

export function AdminRegisterUser() {
  const { t } = useTranslation();
  const canBuyPlan = useOrPermissions(AdminPermissions.planPurchaseRegistration);
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [existingUserId, setExistingUserId] = useState<string | null>(null);
  const [profileDefaults, setProfileDefaults] = useState<Partial<BasicProfileFormValues>>({});
  const [profile, setProfile] = useState<ReturnType<typeof toProfilePayload> | null>(null);
  const [health, setHealth] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState<AdminRegisterUserResponse | null>(null);

  const lookupEmail = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setExistingUserId(null);

    if (email.trim().toLowerCase() !== emailConfirmation.trim().toLowerCase()) {
      setError(t('admin:users.registration.emailMismatch'));

      return;
    }

    setIsLoading(true);

    try {
      const response = await DansshipAPI.usersAdmin.lookupByEmail(email.trim());

      if (!response.ok || !response.data) {
        setError(t('admin:users.registration.failed'));

        return;
      }

      if (response.data.status === 'registered' && response.data.user_id) {
        setExistingUserId(response.data.user_id);
        setNotice(t('admin:users.registration.alreadyRegistered'));

        return;
      }

      if (response.data.status === 'placeholder') {
        setNotice(t('admin:users.registration.placeholderFound'));
        setProfileDefaults({
          full_name: response.data.full_name ?? '',
          phone_country_code: response.data.phone_country_code ?? '+57',
          phone_number: response.data.phone_number ?? '',
        });
      }

      setStep('profile');
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async (preferences: PreferencesProfileFormValues | null) => {
    if (!profile) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await DansshipAPI.usersAdmin.registerUser({
        email: email.trim(),
        email_confirmation: emailConfirmation.trim(),
        terms_accepted: true,
        profile,
        health,
        preferences: preferences ? toPreferencesPayload(preferences) : {},
      });

      if (!response.ok || !response.data) {
        const apiError = response.error;
        const userId =
          apiError instanceof DansshipAPIError
            ? (apiError.body.details as { user_id?: string } | undefined)?.user_id
            : undefined;

        if (userId) {
          setExistingUserId(userId);
          setNotice(t('admin:users.registration.alreadyRegistered'));
          setStep('email');

          return;
        }

        setError(t('admin:users.registration.failed'));

        return;
      }

      setCreated(response.data);
      setStep('done');
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'done' && created) {
    return (
      <section className='grid max-w-xl gap-4'>
        <TemporaryPasswordPanel
          password={created.temporary_password}
          expiresAt={created.temporary_password_expires_at}
        />
        {created.is_email_verified ? null : (
          <p className='text-sm'>{t('admin:users.registration.verificationPending')}</p>
        )}
        <div className='flex flex-wrap gap-2'>
          {canBuyPlan ? (
            <Button asChild>
              <Link to={PageURLS.admin.userPlanPurchase(created.user_id)}>{t('admin:users.registration.buyPlan')}</Link>
            </Button>
          ) : null}
          <Button asChild variant='outline'>
            <Link to={PageURLS.admin.userDetails(created.user_id)}>{t('admin:users.viewUser')}</Link>
          </Button>
        </div>
      </section>
    );
  }

  if (step === 'email') {
    return (
      <form className='grid max-w-xl gap-4' onSubmit={event => void lookupEmail(event)}>
        <div className='grid gap-2'>
          <Label htmlFor='register-email'>{t('admin:users.registration.email')}</Label>
          <Input
            id='register-email'
            type='email'
            required
            value={email}
            onChange={event => setEmail(event.target.value)}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='register-email-confirmation'>{t('admin:users.registration.emailConfirmation')}</Label>
          <Input
            id='register-email-confirmation'
            type='email'
            required
            value={emailConfirmation}
            onChange={event => setEmailConfirmation(event.target.value)}
          />
        </div>
        {notice ? <p className='text-sm'>{notice}</p> : null}
        {existingUserId ? (
          <Button asChild variant='outline' className='w-fit'>
            <Link to={PageURLS.admin.userDetails(existingUserId)}>{t('admin:users.viewUser')}</Link>
          </Button>
        ) : null}
        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}
        <Button type='submit' disabled={isLoading} className='w-fit'>
          {t('admin:users.registration.continue')}
        </Button>
      </form>
    );
  }

  if (step === 'profile') {
    return (
      <div className='max-w-3xl'>
        {notice ? <p className='mb-4 text-sm'>{notice}</p> : null}
        <BasicProfileForm
          isLoading={false}
          error={null}
          requireTermsAcceptance
          showPhotoUpload={false}
          termsI18nKey='admin:users.registration.terms'
          submitLabel={t('admin:users.registration.saveProfile')}
          defaultValues={profileDefaults}
          onSubmit={(values: BasicProfileFormValues) => {
            setProfile(toProfilePayload(values));
            setStep('health');
          }}
        />
      </div>
    );
  }

  if (step === 'health') {
    return (
      <div className='max-w-3xl'>
        <HealthProfileForm
          isLoading={false}
          error={null}
          submitLabel={t('admin:users.registration.saveHealth')}
          onContinue={(values: HealthDataFormValues) => {
            setHealth(toHealthPayload(values));
            setStep('preferences');
          }}
          onSkip={() => {
            setHealth({});
            setStep('preferences');
          }}
        />
      </div>
    );
  }

  return (
    <div className='max-w-3xl'>
      <PreferencesProfileForm
        isLoading={isLoading}
        error={error}
        submitLabel={t('admin:users.registration.savePreferences')}
        onComplete={values => void createUser(values)}
        onSkip={() => void createUser(null)}
      />
    </div>
  );
}
