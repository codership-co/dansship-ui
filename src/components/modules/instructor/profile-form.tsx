import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardDescription,
  CardTitle,
} from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useInstructorProfile, usePromise } from '@hooks';

const profileSchema = z.object({
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  photo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  contact_info: z.string().max(255, 'Contact info too long').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { t } = useTranslation();
  const { response: profileResponse, isLoading: isProfileLoading } = usePromise(() =>
    DansshipAPI.instructors.getProfile(),
  );
  const profile = profileResponse?.data;
  const { isSaving, createProfile, updateProfile } = useInstructorProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: '',
      photo_url: '',
      contact_info: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        bio: profile.bio || '',
        photo_url: profile.photo_url || '',
        contact_info: profile.contact_info || '',
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (profile?.id) {
      await updateProfile(data);
    } else {
      await createProfile(data);
    }

    // reset to establish new 'isDirty' baseline
    reset(data);
  };

  if (isProfileLoading) {
    return (
      <div className='flex justify-center p-8'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('instructor:profile.title')}</CardTitle>

        <CardDescription>{t('instructor:profile.description')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className='max-w-2xl space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='bio'>{t('instructor:biography')}</Label>

            <Textarea
              id='bio'
              placeholder={t('instructor:profile.bioPlaceholder')}
              className='min-h-30'
              {...register('bio')}
            />

            {errors.bio && <p className='text-sm text-alert-500'>{errors.bio.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='photo_url'>{t('instructor:photoUrl')}</Label>

            <Input
              id='photo_url'
              type='url'
              placeholder={t('instructor:profile.photoUrlPlaceholder')}
              {...register('photo_url')}
            />

            {errors.photo_url && <p className='text-sm text-alert-500'>{errors.photo_url.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='contact_info'>{t('instructor:profile.contactInfoLabel')}</Label>

            <Input
              id='contact_info'
              placeholder={t('instructor:profile.contactInfoPlaceholder')}
              {...register('contact_info')}
            />

            {errors.contact_info && <p className='text-sm text-alert-500'>{errors.contact_info.message}</p>}
          </div>

          <Button type='submit' disabled={isSaving || !isDirty}>
            {isSaving ? t('common:saving') : t('instructor:profile.saveProfile')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
