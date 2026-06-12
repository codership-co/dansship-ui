import { useTranslation } from 'react-i18next';
import { LuArrowRight } from 'react-icons/lu';
import { Link } from 'react-router';

import { Section } from '@components/containers';
import { Button } from '@components/ui';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

export const HomeHero = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  return (
    <Section compact className='bg-gradient-hero'>
      <div className='relative flex justify-center gap-10 xl:gap-20 transition-[all_300ms_ease] content-center pb-7 pt-20 sm:pt-40 lg:pb-10'>
        <div className='grid gap-4 content-center max-w-xl'>
          <h1 className='text-primary-200 hero'>
            <span className='block'>{t('home:stitch.hero.kicker1')}</span>
            <span className='block'>
              {t('home:stitch.hero.kicker2')}{' '}
              <span className='text-primary text-header1 font-brand'>{t('home:stitch.hero.kicker3')}</span>
            </span>
          </h1>

          <p>{t('home:stitch.hero.description')}</p>

          <div className='mt-4 flex flex-col gap-2.5 sm:max-w-90 sm:flex-row'>
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

        <section className='relative w-90 h-90 bg-primary-200/50 rounded-full hidden lg:block'>
          <img
            src='/assets/images/home/MujerSS.png'
            alt='Dansship'
            className='absolute left-1/2 top-1/2 max-w-[initial] w-110 h-110 -translate-1/2 block'
          />
        </section>
      </div>
    </Section>
  );
};
