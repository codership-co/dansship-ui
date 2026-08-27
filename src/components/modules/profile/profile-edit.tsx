import { Tabs } from 'polpo/components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  BasicProfileForm,
  CertificationsProfileForm,
  HealthProfileForm,
  OperationalProfileForm,
  PreferencesProfileForm,
} from '@components/forms';
import { SpinnerLoader } from '@components/loaders';
import { useAuth } from '@contexts';
import {
  AuthUser,
  BasicProfilePayload,
  DansshipAPI,
  DaysOfWeek,
  HealthProfilePayload,
  InstructorCertificationPayload,
  OperationalProfilePayload,
  PreferencesProfilePayload,
  ProfileDataKey,
  User,
} from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

export interface ProfileEditData {
  [ProfileDataKey.PROFILE]: BasicProfilePayload;
  [ProfileDataKey.HEALTH]: HealthProfilePayload;
  [ProfileDataKey.PREFERENCES]: PreferencesProfilePayload;
  [ProfileDataKey.OPERATIONAL_PROFILE]: OperationalProfilePayload;
  [ProfileDataKey.CERTIFICATIONS]: { documents: Array<InstructorCertificationPayload> };
}

function asFormString(value: string | null | undefined) {
  return value ?? '';
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toIsoDate(value: Date | string) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value;
}

function getDefaultProfileDataFromUser(user: User, selfProfile?: AuthUser | null): ProfileEditData {
  const health = selfProfile?.health_profile;
  const preferences = selfProfile?.preferences;

  return {
    [ProfileDataKey.PROFILE]: {
      full_name: selfProfile?.full_name ?? user.fullName ?? '',
      birth_date: selfProfile?.birth_date ?? user.birthDate ?? '',
      phone_country_code: selfProfile?.phone_country_code ?? user.phoneCountryCode ?? '',
      phone_number: selfProfile?.phone_number ?? user.phoneNumber ?? '',
      document_type: selfProfile?.document_type ?? user.documentType ?? '',
      document_value: selfProfile?.document_value ?? user.documentValue ?? '',
      city: selfProfile?.city ?? user.city ?? '',
      address: selfProfile?.address ?? user.address ?? '',
    },
    [ProfileDataKey.HEALTH]: {
      emergency_contact_name: asFormString(health?.emergency_contact_name),
      emergency_contact_relative: asFormString(health?.emergency_contact_relative),
      emergency_contact_phone_country_code: asFormString(health?.emergency_contact_phone_country_code) || '+57',
      emergency_contact_phone_number: asFormString(health?.emergency_contact_phone_number),
      eps: asFormString(health?.eps),
      existing_medical_conditions: asFormString(health?.existing_medical_conditions),
    },
    [ProfileDataKey.PREFERENCES]: {
      heard_about_us: asFormString(preferences?.heard_about_us),
      current_level: asFormString(preferences?.current_level),
      goals: preferences?.goals ?? [],
      disciplines: preferences?.disciplines ?? [],
      preferred_schedules: preferences?.preferred_schedules ?? [],
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
  showInstructor: boolean;
}

export function ProfileEdit({ showInstructor }: ProfileEditProps) {
  const { t } = useTranslation();
  const { user, getProfile } = useAuth();
  const {
    response: selfProfileResponse,
    isLoading: isLoadingSelfProfile,
    reFetch: refetchSelfProfile,
  } = usePromise(() => DansshipAPI.auth.getSelfProfile(), true, []);
  const {
    response: operationalResponse,
    isLoading: isLoadingOperational,
    reFetch: refetchOperational,
  } = usePromise(() => DansshipAPI.instructors.getOperationalProfile(), showInstructor);
  const {
    response: certificationsResponse,
    isLoading: isLoadingCertifications,
    reFetch: refetchCertifications,
  } = usePromise(() => DansshipAPI.instructors.listCertifications(), showInstructor);

  const selfProfile = selfProfileResponse?.ok ? selfProfileResponse.data : null;
  const defaultData = useMemo<ProfileEditData>(
    () => getDefaultProfileDataFromUser(user!, selfProfile),
    [selfProfile, user],
  );
  const operationalDefaults = useMemo<OperationalProfilePayload>(
    () => ({
      instagram: operationalResponse?.data?.instagram ?? '',
      availability: (operationalResponse?.data?.availability ?? []).map(slot => ({
        day_of_week: slot.day_of_week as DaysOfWeek,
        start_time: slot.start_time,
        end_time: slot.end_time,
      })),
      disciplines: operationalResponse?.data?.disciplines ?? [],
    }),
    [operationalResponse?.data],
  );

  const { call: saveBasicProfile, isLoading: isSavingBasic } = useCallablePromise(async (data: BasicProfilePayload) => {
    try {
      await DansshipAPI.auth.updateProfile({
        full_name: data.full_name,
        birth_date: toIsoDate(data.birth_date),
        phone_country_code: data.phone_country_code,
        phone_number: data.phone_number,
        document_type: data.document_type,
        document_value: data.document_value,
        city: data.city,
        address: data.address,
      });
      await Promise.all([getProfile(), refetchSelfProfile()]);
      toast.success(t('profile:saveSuccess'));
    } catch {
      toast.error(t('profile:saveFailed'));
    }
  });

  const { call: saveHealthProfile, isLoading: isSavingHealth } = useCallablePromise(
    async (data: HealthProfilePayload) => {
      try {
        await DansshipAPI.auth.updateProfile({ health_profile: data });
        await refetchSelfProfile();
        toast.success(t('profile:saveSuccess'));
      } catch {
        toast.error(t('profile:saveFailed'));
      }
    },
  );

  const { call: savePreferences, isLoading: isSavingPreferences } = useCallablePromise(
    async (data: PreferencesProfilePayload) => {
      try {
        await DansshipAPI.auth.updateProfile({ preferences: data });
        await refetchSelfProfile();
        toast.success(t('profile:saveSuccess'));
      } catch {
        toast.error(t('profile:saveFailed'));
      }
    },
  );

  const { call: saveOperationalProfile, isLoading: isSavingOperational } = useCallablePromise(
    async (data: OperationalProfilePayload) => {
      const result = await DansshipAPI.instructors.updateOperationalProfile(data);

      if (!result.ok) {
        toast.error(t('profile:saveFailed'));

        return;
      }

      await refetchOperational();
      toast.success(t('profile:saveSuccess'));
    },
  );

  const { call: saveCertifications, isLoading: isSavingCertifications } = useCallablePromise(
    async (documents: Array<InstructorCertificationPayload & { certificationId?: string }>) => {
      try {
        const newDocuments = documents.filter(document => !document.certificationId && document.file_key);

        for (const document of newDocuments) {
          const { ok, error: createError } = await DansshipAPI.instructors.createCertification({
            title: document.title,
            issuer: document.issuer,
            file_key: document.file_key!,
            issue_date: document.issue_date ?? null,
          });

          if (!ok) {
            throw createError ?? new Error('Failed to create certification');
          }
        }

        await refetchCertifications();
        toast.success(t('profile:certificationsSaveSuccess'));
      } catch {
        toast.error(t('profile:certificationsSaveFailed'));
      }
    },
  );

  const existingCertificationDocuments = useMemo(
    () =>
      (certificationsResponse?.data ?? []).map(certification => ({
        certificationId: certification.id,
        title: certification.title,
        issuer: certification.issuer,
        file_key: certification.file_key,
        issue_date: certification.issue_date,
      })),
    [certificationsResponse?.data],
  );

  if (isLoadingSelfProfile && !selfProfile) {
    return (
      <div className='flex justify-center p-12'>
        <SpinnerLoader />
      </div>
    );
  }

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
                isLoading={isSavingBasic}
                error=''
                submitLabel={t('common:save')}
                onSubmit={data => {
                  void saveBasicProfile({
                    full_name: data.full_name,
                    birth_date: toIsoDate(data.birth_date),
                    phone_country_code: data.phone_country_code,
                    phone_number: data.phone_number,
                    document_type: data.document_type,
                    document_value: data.document_value,
                    city: data.city,
                    address: data.address,
                  });
                }}
                defaultValues={{
                  ...defaultData[ProfileDataKey.PROFILE],
                  birth_date: toDateInputValue(defaultData[ProfileDataKey.PROFILE].birth_date),
                }}
              />
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={ProfileDataKey.HEALTH}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.second.title')}</h3>
              <p>{t('auth:onboarding.steps.second.subtitle')}</p>

              <HealthProfileForm
                isLoading={isSavingHealth}
                error=''
                showSkip={false}
                submitLabel={t('common:save')}
                onContinue={data => {
                  void saveHealthProfile(data);
                }}
                defaultValues={defaultData[ProfileDataKey.HEALTH]}
              />
            </section>
          </Tabs.TabPanel>
          <Tabs.TabPanel id={ProfileDataKey.PREFERENCES}>
            <section>
              <h3 className='text-primary'>{t('auth:onboarding.steps.third.title')}</h3>
              <p>{t('auth:onboarding.steps.third.subtitle')}</p>

              <PreferencesProfileForm
                isLoading={isSavingPreferences}
                error=''
                submitLabel={t('common:save')}
                onComplete={data => {
                  void savePreferences(data);
                }}
                defaultValues={defaultData[ProfileDataKey.PREFERENCES]}
              />
            </section>
          </Tabs.TabPanel>
          {showInstructor && (
            <Tabs.TabPanel id={ProfileDataKey.OPERATIONAL_PROFILE}>
              <section>
                <h3 className='text-primary'>{t('auth:onboarding.instructorSteps.first.title')}</h3>
                <p>{t('auth:onboarding.instructorSteps.first.subtitle')}</p>

                {isLoadingOperational ? (
                  <div className='flex justify-center p-12'>
                    <SpinnerLoader />
                  </div>
                ) : (
                  <OperationalProfileForm
                    isLoading={isSavingOperational}
                    error=''
                    submitLabel={t('common:save')}
                    onSubmit={data => {
                      void saveOperationalProfile(data);
                    }}
                    defaultValues={operationalDefaults}
                  />
                )}
              </section>
            </Tabs.TabPanel>
          )}
          {showInstructor && (
            <Tabs.TabPanel id={ProfileDataKey.CERTIFICATIONS}>
              <section>
                <h3 className='text-primary'>{t('auth:onboarding.instructorSteps.second.title')}</h3>
                <p>{t('auth:onboarding.instructorSteps.second.subtitle')}</p>

                {isLoadingCertifications ? (
                  <div className='flex justify-center p-12'>
                    <SpinnerLoader />
                  </div>
                ) : (
                  <CertificationsProfileForm
                    isLoading={isSavingCertifications}
                    error={null}
                    defaultDocuments={existingCertificationDocuments}
                    uploadDocument={file => DansshipAPI.instructors.uploadCertificationDocument(file)}
                    submitLabel={t('common:save')}
                    onComplete={documents => {
                      void saveCertifications(documents);
                    }}
                  />
                )}
              </section>
            </Tabs.TabPanel>
          )}
        </section>
      </Tabs>
    </section>
  );
}
