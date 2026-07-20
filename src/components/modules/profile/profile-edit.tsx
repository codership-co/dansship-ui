import { Tabs } from 'polpo/components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  BasicProfileForm,
  CertificationsProfileForm,
  HealthProfileForm,
  OperationalProfileForm,
  PreferencesProfileForm,
} from '@components/forms';
import { useAuth } from '@contexts';
import {
  BasicProfilePayload,
  CertificationsProfilePayload,
  HealthProfilePayload,
  OperationalProfilePayload,
  PreferencesProfilePayload,
  ProfileDataKey,
  User,
} from '@core/api';

export interface ProfileEditData {
  [ProfileDataKey.PROFILE]: BasicProfilePayload;
  [ProfileDataKey.HEALTH]: HealthProfilePayload;
  [ProfileDataKey.PREFERENCES]: PreferencesProfilePayload;
  [ProfileDataKey.OPERATIONAL_PROFILE]: OperationalProfilePayload;
  [ProfileDataKey.CERTIFICATIONS]: CertificationsProfilePayload;
}

function getDefaultProfileDataFromUser(user: User): ProfileEditData {
  return {
    [ProfileDataKey.PROFILE]: {
      full_name: user.fullName ?? '',
      birth_date: user.birthDate ?? '',
      phone_country_code: user.phoneCountryCode ?? '',
      phone_number: user.phoneNumber ?? '',
      document_type: user.documentType ?? '',
      document_value: user.documentValue ?? '',
      city: user.city ?? '',
      address: user.address ?? '',
    },
    [ProfileDataKey.HEALTH]: {
      emergency_contact_name: '',
      emergency_contact_relative: '',
      emergency_contact_phone_country_code: '',
      emergency_contact_phone_number: '',
      eps: '',
      existing_medical_conditions: '',
    },
    [ProfileDataKey.PREFERENCES]: {
      heard_about_us: '',
      current_level: '',
      goals: [],
      disciplines: [],
      preferred_schedules: [],
    },
    [ProfileDataKey.OPERATIONAL_PROFILE]: {
      instagram: '',
      availability: [],
      disciplines: [],
    },
    [ProfileDataKey.CERTIFICATIONS]: {
      documents: [],
    },
  };
}

interface ProfileEditProps {
  isLoading: boolean;
  onChange: (key: ProfileDataKey, data: unknown) => void;
  error: string;
  showInstructor: boolean;
}

export function ProfileEdit({ onChange, isLoading, error, showInstructor }: ProfileEditProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const defaultData = useMemo<ProfileEditData>(() => getDefaultProfileDataFromUser(user!), [user]);

  return (
    <section className='grid md:grid-cols-[auto_1fr] gap-8 md:items-start'>
      <Tabs defaultOpenTab={ProfileDataKey.PROFILE}>
        <Tabs.TabList
          color='primary'
          className='md:px-4 md:py-8 grid-flow-row sm:grid-flow-col md:grid-flow-row'
          tabs={[
            { id: ProfileDataKey.PROFILE, label: t('auth:onboarding.steps.first.title') },
            { id: ProfileDataKey.HEALTH, label: t('auth:onboarding.steps.second.title') },
            { id: ProfileDataKey.PREFERENCES, label: t('auth:onboarding.steps.third.title') },
            ...(showInstructor
              ? [{ id: ProfileDataKey.OPERATIONAL_PROFILE, label: t('auth:onboarding.instructorSteps.first.title') }]
              : []),
            ...(showInstructor
              ? [{ id: ProfileDataKey.CERTIFICATIONS, label: t('auth:onboarding.instructorSteps.second.title') }]
              : []),
          ]}
        />

        <section className='grid gap-8'>
          <Tabs.TabPanel id={ProfileDataKey.PROFILE}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.first.title')}</h3>
              <p>{t('auth:onboarding.steps.first.subtitle')}</p>

              <BasicProfileForm
                isLoading={isLoading}
                error={error}
                onSubmit={data => onChange(ProfileDataKey.PROFILE, data)}
                defaultValues={{
                  ...defaultData[ProfileDataKey.PROFILE],
                  birth_date: new Date(defaultData[ProfileDataKey.PROFILE].birth_date ?? ''),
                }}
              />
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={ProfileDataKey.HEALTH}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.second.title')}</h3>
              <p>{t('auth:onboarding.steps.second.subtitle')}</p>

              <HealthProfileForm
                isLoading={isLoading}
                error={error}
                onContinue={data => onChange(ProfileDataKey.HEALTH, data)}
                onSkip={() => onChange(ProfileDataKey.HEALTH, {})}
                defaultValues={defaultData[ProfileDataKey.HEALTH]}
              />
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={ProfileDataKey.PREFERENCES}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.third.title')}</h3>
              <p>{t('auth:onboarding.steps.third.subtitle')}</p>

              <PreferencesProfileForm
                isLoading={isLoading}
                error={error}
                onComplete={data => onChange(ProfileDataKey.PREFERENCES, data)}
                defaultValues={defaultData[ProfileDataKey.PREFERENCES]}
              />
            </section>
          </Tabs.TabPanel>
          {showInstructor && (
            <Tabs.TabPanel id={ProfileDataKey.OPERATIONAL_PROFILE}>
              <section>
                <h3 className='text-primary'>{t('auth:onboarding.instructorSteps.first.title')}</h3>
                <p>{t('auth:onboarding.instructorSteps.first.subtitle')}</p>

                <OperationalProfileForm
                  isLoading={isLoading}
                  error={error}
                  onSubmit={data => onChange(ProfileDataKey.OPERATIONAL_PROFILE, data)}
                  defaultValues={defaultData[ProfileDataKey.OPERATIONAL_PROFILE]}
                />
              </section>
            </Tabs.TabPanel>
          )}
          {showInstructor && (
            <Tabs.TabPanel id={ProfileDataKey.CERTIFICATIONS}>
              <section>
                <h3 className='text-primary'>{t('auth:onboarding.instructorSteps.second.title')}</h3>
                <p>{t('auth:onboarding.instructorSteps.second.subtitle')}</p>

                <CertificationsProfileForm
                  isLoading={isLoading}
                  error={error}
                  onComplete={data => onChange(ProfileDataKey.CERTIFICATIONS, data)}
                />
              </section>
            </Tabs.TabPanel>
          )}
        </section>
      </Tabs>
    </section>
  );
}
