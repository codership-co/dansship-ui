import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { CreateInstructorProfilePayload, DansshipAPI, UpdateInstructorProfilePayload } from '@core/api';

export const useInstructorProfile = () => {
  const { t } = useTranslation();

  const { call: createProfilePromise, isLoading: isCreatingProfile } = useCallablePromise(
    (payload: CreateInstructorProfilePayload) => DansshipAPI.instructors.createProfile(payload),
  );
  const { call: updateProfilePromise, isLoading: isUpdatingProfile } = useCallablePromise(
    (payload: UpdateInstructorProfilePayload) => DansshipAPI.instructors.updateProfile(payload),
  );

  const createProfile = useCallback(
    async (payload: CreateInstructorProfilePayload) => {
      const { error } = await createProfilePromise(payload);

      if (error) {
        toast.error(t('instructor:profile.createFailed'));
      } else {
        toast.success(t('instructor:profile.createSuccess'));
      }
    },
    [createProfilePromise, t],
  );
  const updateProfile = useCallback(
    async (payload: UpdateInstructorProfilePayload) => {
      const { error } = await updateProfilePromise(payload);

      if (error) {
        toast.error(t('instructor:profile.updateFailed'));
      } else {
        toast.success(t('instructor:profile.updateSuccess'));
      }
    },
    [t, updateProfilePromise],
  );

  return {
    isSaving: isCreatingProfile || isUpdatingProfile,
    createProfile,
    isCreatingProfile,
    updateProfile,
    isUpdatingProfile,
  };
};
