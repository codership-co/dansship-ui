import { cn } from 'polpo/helpers';

import { useAuth } from '@contexts';

const defaultImage = 'https://placehold.net/avatar.png';

type ProfilePictureProps = {
  className?: string;
};

export function ProfilePicture({ className }: ProfilePictureProps) {
  const { user } = useAuth();

  const imageUrl = user?.instructorProfile?.photoUrl || user?.avatar;

  return (
    <section className={cn('size-24 rounded-full object-cover', className)}>
      <img src={imageUrl || defaultImage} alt={user?.name} className='size-full object-cover inline-block' />
    </section>
  );
}
