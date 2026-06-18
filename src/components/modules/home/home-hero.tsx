import { useTranslation } from 'react-i18next';
import { LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router';

import { Section } from '@components/containers';
import { Logotype } from '@components/svg';
import { Button } from '@components/ui';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

export const HomeHero = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <Section compact className='bg-gradient-hero'>
      <div className='relative gap-10 xl:gap-20 home-hero transition-[all_300ms_ease] pb-7 pt-20 sm:pt-40 lg:pb-10'>
        <div className='grid gap-4 content-center max-w-xl' style={{ gridArea: 'text' }}>
          <h1 className='text-accent hero leading-none m-0'>
            <span className='block'>{t('home:stitch.hero.kicker1')}</span>
            <span className='block'>
              {t('home:stitch.hero.kicker2')} <Logotype className='h-[0.65em] sm:h-[0.75em] inline-block' />
            </span>
          </h1>

          <p className='m-0'>{t('home:stitch.hero.description')}</p>

          <div className='mt-4 flex flex-row gap-2.5 sm:max-w-90'>
            <Link to={isAuthenticated ? PageURLS.profile : PageURLS.auth.signup}>
              <Button>
                {t('home:stitch.hero.bookClass')}
                <LuArrowRight className='h-4 w-4' />
              </Button>
            </Link>

            <Link to={PageURLS.figures}>
              <Button variant='secondary'>{t('home:stitch.hero.trackProgress')}</Button>
            </Link>
          </div>
        </div>

        <section className='relative size-60 lg:size-100 bg-accent rounded-full' style={{ gridArea: 'image' }}>
          <img
            src='/assets/images/home/MujerSS.png'
            alt='Dansship'
            className='absolute left-1/2 top-1/2 max-w-[initial] w-70 lg:w-130 -translate-1/2 block'
          />
        </section>
      </div>
    </Section>
  );
};
