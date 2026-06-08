import { useTranslation } from 'react-i18next';
import { LuArrowRight } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';

import { Section } from '@components/containers';
import { Button } from '@components/ui';
import { useAuth } from '@contexts';

export const HomeHero = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleShareClick = () => {
    navigate(isAuthenticated ? '/profile' : '/auth/signup');
  };

  return (
    <Section compact className='py-8 relative'>
      <div className='relative px-5 pb-7 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pb-10'>
        <div className='relative z-10 max-w-3xl'>
          <h1 className='mt-2 max-w-2xl text-primary text-hero'>
            <span className='block'>{t('home:stitch.hero.kicker1')}</span>
            <span className='block'>{t('home:stitch.hero.kicker2')}</span>
          </h1>

          <p className='mt-5 max-w-140 text-muted-foreground'>{t('home:stitch.hero.description')}</p>

          <div className='mt-7 flex flex-col gap-2.5 sm:max-w-90 sm:flex-row'>
            <Button onClick={handleShareClick}>
              {t('home:stitch.hero.bookClass')}
              <LuArrowRight className='h-4 w-4' />
            </Button>

            <Button asChild variant='secondary'>
              <Link to='/figures'>{t('home:stitch.hero.trackProgress')}</Link>
            </Button>
          </div>
        </div>

        <img
          src='https://t4.ftcdn.net/jpg/01/34/98/47/360_F_134984731_eW2iZhb0Oe12BSQzSef2PixuWBMe329X.jpg'
          alt={t('home:stitch.hero.imageAlt')}
          className='card pointer-events-none absolute right-10 top-1/2 hidden w-120 h-100 object-cover max-w-none -translate-y-1/2 lg:block'
        />
      </div>

      <div className='pointer-events-none absolute inset-x-0 -top-36 h-[calc(100%+12rem)] bg-[radial-gradient(circle_at_12%_20%,rgba(252,164,183,0.22),transparent_50%),radial-gradient(circle_at_80%_78%,rgba(88,47,89,0.16),transparent_46%)]' />
    </Section>
  );
};
