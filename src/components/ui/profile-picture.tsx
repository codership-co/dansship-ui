import { cn } from 'polpo/helpers';

import { useAuth } from '@contexts';

type ProfilePictureProps = {
  className?: string;
  image?: string;
  useUserImage?: boolean;
};

export function ProfilePicture({ className, image, useUserImage }: ProfilePictureProps) {
  const { user } = useAuth();

  const imageUrl = useUserImage ? user?.avatar || user?.instructorProfile?.photoUrl : image;
  const defaultImage = '/assets/images/avatar/default.png';

  return (
    <section className={cn('bg-white size-24 rounded-full object-cover overflow-hidden', className)}>
      <img src={imageUrl || defaultImage} alt={user?.name} className='size-full object-cover inline-block' />
    </section>
  );
}
