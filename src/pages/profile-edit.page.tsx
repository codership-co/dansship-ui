import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuSave } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { useInstructorProfile, usePromise } from '@hooks';

interface InstructorProfileFormData {
  bio: string;
  photo_url: string;
  contact_info: string;
}

interface AccountProfileFormData {
  full_name: string;
  display_name: string;
}

function ProfileEditPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, updateProfile: updateAuthProfile } = useAuth();

  const normalizedRoles = useMemo(() => (user?.roles ?? []).map(role => role.toLowerCase()), [user]);
  const isInstructor = useMemo(() => {
    if (!user) {
      return false;
    }

    const hasRole = normalizedRoles.some(role => ['instructor', 'coach'].includes(role));

    return hasRole || Boolean(user.isCoach);
  }, [normalizedRoles, user]);
  const canEditInstructorProfile = isInstructor;
  const { response: profileResponse, isLoading: isProfileLoading } = usePromise(
    () => DansshipAPI.instructors.getProfile(),
    Boolean(user && isInstructor),
  );
  const profile = profileResponse?.data;

  const { isSaving, createProfile, updateProfile } = useInstructorProfile();

  const [accountFormData, setAccountFormData] = useState<AccountProfileFormData>({
    full_name: '',
    display_name: '',
  });

  const [formData, setFormData] = useState<InstructorProfileFormData>({
    bio: '',
    photo_url: '',
    contact_info: '',
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    const fullName = user.fullName || user.name || user.username;
    const displayName = user.displayName || fullName;

    setAccountFormData({
      full_name: fullName,
      display_name: displayName,
    });

    setFormData({
      bio: profile?.bio ?? user.instructorProfile?.bio ?? '',
      photo_url: profile?.photo_url ?? user.instructorProfile?.photoUrl ?? '',
      contact_info: profile?.contact_info ?? user.instructorProfile?.contactInfo ?? '',
    });
  }, [profile, user]);

  const instructorLastUpdated = profile?.updated_at
    ? new Date(profile.updated_at).toLocaleString()
    : user?.instructorProfile?.updatedAt
      ? new Date(user.instructorProfile.updatedAt).toLocaleString()
      : null;

  const hasUrlError = useMemo(() => {
    const value = formData.photo_url.trim();

    if (!value) {
      return false;
    }

    try {
      // eslint-disable-next-line no-new
      new URL(value);

      return value.length > 500;
    } catch {
      return true;
    }
  }, [formData.photo_url]);

  const accountIsDirty = useMemo(() => {
    const baselineFullName = (user?.fullName || user?.name || user?.username || '').trim();
    const baselineDisplayName = (user?.displayName || baselineFullName).trim();

    return (
      accountFormData.full_name.trim() !== baselineFullName ||
      accountFormData.display_name.trim() !== baselineDisplayName
    );
  }, [accountFormData, user]);

  const instructorIsDirty = useMemo(() => {
    const baselineBio = (profile?.bio ?? user?.instructorProfile?.bio ?? '').trim();
    const baselinePhotoUrl = (profile?.photo_url ?? user?.instructorProfile?.photoUrl ?? '').trim();
    const baselineContactInfo = (profile?.contact_info ?? user?.instructorProfile?.contactInfo ?? '').trim();

    return (
      formData.bio.trim() !== baselineBio ||
      formData.photo_url.trim() !== baselinePhotoUrl ||
      formData.contact_info.trim() !== baselineContactInfo
    );
  }, [formData, profile, user]);

  const canSaveAccount = accountFormData.full_name.trim().length > 0;
  const canSaveInstructor = !hasUrlError;
  const hasChanges = accountIsDirty || (canEditInstructorProfile && instructorIsDirty);

  const handleSave = async () => {
    if (!canSaveAccount) {
      return;
    }

    const profilePayload: { full_name?: string; display_name?: string } = {};
    const trimmedFullName = accountFormData.full_name.trim();
    const trimmedDisplayName = accountFormData.display_name.trim();
    const baselineFullName = (user?.fullName || user?.name || user?.username || '').trim();
    const baselineDisplayName = (user?.displayName || baselineFullName).trim();

    if (trimmedFullName !== baselineFullName) {
      profilePayload.full_name = trimmedFullName;
    }

    if (trimmedDisplayName !== baselineDisplayName) {
      profilePayload.display_name = trimmedDisplayName || undefined;
    }

    if (Object.keys(profilePayload).length > 0) {
      await updateAuthProfile(profilePayload);
    }

    const payload = {
      bio: formData.bio.trim() || null,
      photo_url: formData.photo_url.trim() || null,
      contact_info: formData.contact_info.trim() || null,
    };

    if (canEditInstructorProfile && canSaveInstructor && instructorIsDirty) {
      if (profile?.id) {
        await updateProfile(payload);
      } else {
        await createProfile(payload);
      }
    }

    navigate(PageURLS.profile);
  };

  const handleCancel = () => {
    navigate(PageURLS.profile);
  };

  if (canEditInstructorProfile && isProfileLoading) {
    return <SpinnerLoader message={t('common:loading')} />;
  }

  if (!user) {
    return <div className='text-center py-12'>{t('profile:notFound')}</div>;
  }

  return (
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <div className='flex flex-col gap-4 mb-8 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>{t('common:editProfile')}</h1>
          <p className='text-sm text-gray-600 mt-1'>{t('profile:editSubtitle')}</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={handleCancel}>
            <LuArrowLeft className='w-4 h-4' />
            {t('common:cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges || !canSaveAccount || (canEditInstructorProfile && !canSaveInstructor)}
          >
            <LuSave className='w-4 h-4' />
            {isSaving ? t('common:saving') : t('common:saveChanges')}
          </Button>
        </div>
      </div>

      <div className='max-w-3xl'>
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle>{t('profile:identityTitle')}</CardTitle>

            <CardDescription>{t('profile:identityDescription')}</CardDescription>
          </CardHeader>

          <CardContent>
            <form className='space-y-4' onSubmit={event => event.preventDefault()}>
              <div className='space-y-2'>
                <Label htmlFor='full_name'>{t('auth:signup.fullName')}</Label>

                <Input
                  id='full_name'
                  value={accountFormData.full_name}
                  maxLength={255}
                  onChange={event =>
                    setAccountFormData(prev => ({
                      ...prev,
                      full_name: event.target.value,
                    }))
                  }
                  placeholder={t('auth:signup.fullNamePlaceholder')}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='display_name'>{t('profile:displayName')}</Label>

                <Input
                  id='display_name'
                  value={accountFormData.display_name}
                  maxLength={255}
                  onChange={event =>
                    setAccountFormData(prev => ({
                      ...prev,
                      display_name: event.target.value,
                    }))
                  }
                  placeholder={t('profile:displayNamePlaceholder')}
                />
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('common:editProfile')}</CardTitle>

            <CardDescription>
              {canEditInstructorProfile
                ? t('profile:editableInstructorFields')
                : t('profile:noEditableInstructorFields')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!canEditInstructorProfile ? (
              <div className='rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-sm text-gray-600'>
                {t('profile:noEditableInstructorFields')}
              </div>
            ) : (
              <form className='space-y-6' onSubmit={event => event.preventDefault()}>
                <div className='space-y-2'>
                  <Label htmlFor='bio'>{t('instructor:biography')}</Label>

                  <Textarea
                    id='bio'
                    className='min-h-35'
                    maxLength={1000}
                    value={formData.bio}
                    onChange={event =>
                      setFormData(prev => ({
                        ...prev,
                        bio: event.target.value,
                      }))
                    }
                    placeholder={t('instructor:profile.bioPlaceholder')}
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='photo_url'>{t('instructor:photoUrl')}</Label>

                  <Input
                    id='photo_url'
                    type='url'
                    maxLength={500}
                    value={formData.photo_url}
                    onChange={event =>
                      setFormData(prev => ({
                        ...prev,
                        photo_url: event.target.value,
                      }))
                    }
                    placeholder={t('instructor:profile.photoUrlPlaceholder')}
                  />

                  {hasUrlError && <p className='text-sm text-alert-600'>{t('instructor:profile.photoUrlInvalid')}</p>}
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='contact_info'>{t('instructor:profile.contactInfoLabel')}</Label>

                  <Input
                    id='contact_info'
                    value={formData.contact_info}
                    onChange={event =>
                      setFormData(prev => ({
                        ...prev,
                        contact_info: event.target.value,
                      }))
                    }
                    placeholder={t('instructor:profile.contactInfoPlaceholder')}
                  />
                </div>

                {instructorLastUpdated && (
                  <p className='text-xs text-gray-500'>
                    {t('profile:lastUpdated')}: {instructorLastUpdated}
                  </p>
                )}

                <div className='flex justify-end'>
                  <Button
                    type='button'
                    onClick={handleSave}
                    disabled={isSaving || !hasChanges || !canSaveAccount || !canSaveInstructor}
                  >
                    <LuSave className='h-4 w-4' />
                    {isSaving ? t('common:saving') : t('common:saveChanges')}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export const SecureProfileEditPage = SecurityGuard(ProfileEditPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isProfileEditPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
