import { Badge, Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuCalendar, LuCreditCard, LuPencil } from 'react-icons/lu';
import { Link } from 'react-router';

import { Section } from '@components/containers';
import { ProfilePicture } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

export function ProfileHeader() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { response: savedFiguresResponse } = usePromise(() => DansshipAPI.figures.getSavedFigures());
  const { response: mySubscriptionsResponse } = usePromise(() => DansshipAPI.subscriptions.getMySubscriptions());
  const savedFigures = savedFiguresResponse?.data ?? [];
  const summary = mySubscriptionsResponse?.data?.summary ?? null;

  if (!user) return null;

  const profileCompletion = user.profileCompletionPercent ?? 100;

  return (
    <Section navbarPadding className='bg-primary' contentClassName='pb-13'>
      <section className='relative'>
        <section className='bg-white rounded-[0_158px_0_158px] shadow-2xl grid grid-cols-[auto_1fr_auto] gap-8 mt-20 items-center overflow-hidden'>
          <section className='bg-accent h-full p-6 flex'>
            <ProfilePicture className='size-80 border-10 bg-transparent border-accent m-auto' />
          </section>
          <section className='py-8 pl-8 pr-16'>
            {user.roles.length > 0 && (
              <div className='mt-2 flex flex-wrap gap-2'>
                {user.roles.map(role => (
                  <Badge key={role} color='secondary'>
                    {role}
                  </Badge>
                ))}
              </div>
            )}

            <h2 className='text-primary'>{user.displayName || user.fullName || user.name || user.username}</h2>

            <p>{user.instructorProfile?.bio || user.bio}</p>

            <section className='grid grid-cols-[repeat(auto-fit,100px)] gap-3 text-center'>
              <article className='w-20 grid justify-items-center'>
                <h4 className='m-0'>{savedFigures.length}</h4>
                <small className='m-0'>{t('profile:stats.savedFigures')}</small>
              </article>

              <article className='w-20 grid justify-items-center'>
                <h4 className='m-0'>{summary?.total_remaining_classes}</h4>
                <small className='m-0'>{t('subscriptions:totalRemaining')}</small>
              </article>

              <article className='w-20 grid justify-items-center'>
                <h4 className='m-0'>{summary?.active_count}</h4>
                <small className='m-0'>{t('subscriptions:activePlans')}</small>
              </article>
            </section>
          </section>

          <section className='size-60 bg-secondary/20 rounded-full grid place-content-center text-center mr-10'>
            <article className='grid justify-items-center'>
              <h2 className='m-0'>{profileCompletion}%</h2>
              <small className='m-0 w-20'>{t('profile:completion')}</small>
            </article>
          </section>
        </section>

        <section className='bg-accent/80 backdrop-blur-md p-4 shadow-lg rounded-md flex gap-4 absolute top-[calc(100%+20px)] right-0'>
          <Link to={PageURLS.profile.subscription}>
            <Button variant='solid' color='primary' size='small'>
              <LuCreditCard className='h-4 w-4' />
              {t('profile:subscriptions')}
            </Button>
          </Link>

          <Link to={PageURLS.profile.bookings}>
            <Button variant='solid' color='primary' size='small'>
              <LuCalendar className='h-4 w-4' />
              {t('profile:bookings')}
            </Button>
          </Link>

          <Link to={PageURLS.profile.edit}>
            <Button variant='solid' color='secondary' size='small'>
              <LuPencil className='h-4 w-4' />
              {t('common:edit')}
            </Button>
          </Link>
        </section>
      </section>
    </Section>
  );
}
