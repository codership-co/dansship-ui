import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { parseProfileDate, toHealthPayload, toPreferencesPayload, toProfilePayload } from './admin-user-profile';

import { BasicProfileForm, HealthProfileForm, PreferencesProfileForm } from '@components/forms';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

import type { HealthDataFormValues } from '@components/forms/health-profile-form';
import type { PreferencesProfileFormValues } from '@components/forms/preferences-profile-form';

type Step = 'profile' | 'health' | 'preferences';

interface AdminEditUserProps {
  userId: string;
}

export function AdminEditUser({ userId }: AdminEditUserProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { response, isLoading: isUserLoading } = usePromise(() => DansshipAPI.usersAdmin.getById(userId), !!userId);
  const user = response?.data;
  const [step, setStep] = useState<Step>('profile');
  const [profile, setProfile] = useState<ReturnType<typeof toProfilePayload> | null>(null);
  const [health, setHealth] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async (preferences: PreferencesProfileFormValues | null) => {
    if (!profile) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await DansshipAPI.usersAdmin.updateOnboarding(userId, {
        profile,
        health,
        preferences: preferences ? toPreferencesPayload(preferences) : {},
      });

      if (!result.ok) {
        setError(t('admin:users.registration.saveFailed'));

        return;
      }

      toast.success(t('admin:users.registration.saved'));
      void navigate(PageURLS.admin.userDetails(userId));
    } finally {
      setIsSaving(false);
    }
  };

  if (isUserLoading || !user) {
    return <p>{t('admin:users.details.loading')}</p>;
  }

  if (step === 'profile') {
    return (
      <div className='max-w-3xl'>
        <BasicProfileForm
          isLoading={false}
          error={null}
          showPhotoUpload={false}
          submitLabel={t('admin:users.registration.saveProfile')}
          defaultValues={{
            full_name: user.full_name,
            birth_date: parseProfileDate(user.birth_date),
            phone_country_code: user.phone_country_code ?? '+57',
            phone_number: user.phone_number ?? '',
            document_type: user.document_type ?? '',
            document_value: user.document_value ?? '',
            city: user.city ?? '',
            address: user.address ?? '',
            guardian_first_name: user.guardian_first_name ?? '',
            guardian_last_name: user.guardian_last_name ?? '',
            guardian_phone_country_code: user.guardian_phone_country_code ?? '+57',
            guardian_phone_number: user.guardian_phone_number ?? '',
          }}
          onSubmit={values => {
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
          defaultValues={{
            emergency_contact_name: user.health_profile?.emergency_contact_name ?? '',
            emergency_contact_relative: user.health_profile?.emergency_contact_relative ?? '',
            emergency_contact_phone_country_code: user.health_profile?.emergency_contact_phone_country_code ?? '+57',
            emergency_contact_phone_number: user.health_profile?.emergency_contact_phone_number ?? '',
            eps: user.health_profile?.eps ?? '',
            existing_medical_conditions: user.health_profile?.existing_medical_conditions ?? '',
          }}
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
        isLoading={isSaving}
        error={error}
        submitLabel={t('admin:users.registration.save')}
        defaultValues={{
          heard_about_us: user.preferences?.heard_about_us ?? '',
          goals: user.preferences?.goals ?? [],
          disciplines: user.preferences?.disciplines ?? [],
          current_level: user.preferences?.current_level ?? '',
          preferred_schedules: user.preferences?.preferred_schedules ?? [],
        }}
        onComplete={values => void save(values)}
        onSkip={() => void save(null)}
      />
    </div>
  );
}
