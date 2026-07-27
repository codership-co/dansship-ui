import { cn } from 'polpo/helpers';

import { useAuth } from '@contexts';

type ProfilePictureProps = {
  className?: string;
  image?: string;
  alt?: string;
  useAuthFallback?: boolean;
};

export function ProfilePicture({ className, image, alt, useAuthFallback = true }: ProfilePictureProps) {
  const { user } = useAuth();

  const imageUrl = image || (useAuthFallback ? user?.avatar || user?.instructorProfile?.photoUrl : undefined);
  const defaultImage = '/assets/images/avatar/default.png';

  return (
    <section className={cn('bg-white size-24 rounded-full object-cover overflow-hidden', className)}>
      <img
        src={imageUrl || defaultImage}
        alt={alt || user?.name || 'Profile'}
        className='size-full object-cover inline-block'
      />
    </section>
  );
}
