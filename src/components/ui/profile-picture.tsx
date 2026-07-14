import { cn } from 'polpo/helpers';

import { useAuth } from '@contexts';

const images = [
  '/assets/images/avatar/boy-1.png',
  '/assets/images/avatar/boy-2.png',
  '/assets/images/avatar/boy-3.png',
  '/assets/images/avatar/girl-1.png',
  '/assets/images/avatar/girl-2.png',
  '/assets/images/avatar/girl-3.png',
];

type ProfilePictureProps = {
  className?: string;
};

export function ProfilePicture({ className }: ProfilePictureProps) {
  const { user } = useAuth();

  const imageUrl = user?.instructorProfile?.photoUrl || user?.avatar;
  const defaultImage = images[Math.floor(Math.random() * 6)];

  return (
    <section className={cn('bg-white size-24 rounded-full object-cover overflow-hidden', className)}>
      <img src={imageUrl || defaultImage} alt={user?.name} className='size-full object-cover inline-block' />
    </section>
  );
}
