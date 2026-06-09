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
    <Section compact className='py-8 relative'>
      <div className='pointer-events-none absolute inset-x-0 -top-36 h-[calc(100%+12rem)] bg-[radial-gradient(circle_at_12%_20%,rgba(252,164,183,0.22),transparent_50%),radial-gradient(circle_at_80%_78%,rgba(88,47,89,0.16),transparent_46%)]' />

      <div className='relative px-5 pb-7 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pb-10'>
        <div className='relative z-10 max-w-3xl'>
          <h1 className='mt-2 max-w-2xl text-primary text-hero'>
            <span className='block'>{t('home:stitch.hero.kicker1')}</span>
            <span className='block'>{t('home:stitch.hero.kicker2')}</span>
          </h1>

          <p className='mt-5 max-w-140 text-muted-foreground'>{t('home:stitch.hero.description')}</p>

          <div className='mt-7 flex flex-col gap-2.5 sm:max-w-90 sm:flex-row'>
            <Link to={isAuthenticated ? PageURLS.profile : PageURLS.auth.signup}>
              <Button>
                {t('home:stitch.hero.bookClass')}
                <LuArrowRight className='h-4 w-4' />
              </Button>
            </Link>

            <Link to={PageURLS.figures}>
              <Button asChild variant='secondary'>
                {t('home:stitch.hero.trackProgress')}
              </Button>
            </Link>
          </div>
        </div>

        <img
          src='https://lh3.googleusercontent.com/aida-public/AB6AXuChv5_6woQEEGxJQLXO3YugWIU3v9MGvyrYeOA_6OzifdUP00Cb3xqJOWhOZnMnDqUShrNHzHio_L7-IECtL0YoINUFPFkvqh_O56vLHT2VcZPUdUsB0WZCgOH6M9EXB5IwFF2CISpjV5EMb3e3yw4Nqtk6_ejzWWXqayQinxIPGXfTptOlPNUiKkOcbzBCaEiTGW6Du8v6b8iQljVPg2dNbgLylCjUhcTao0ai_FvdECEHqDMf5Mr3y0B5Iw9AFNwnFmeiIIhsGhA'
          alt={t('home:stitch.hero.imageAlt')}
          className='card pointer-events-none absolute right-10 top-1/2 hidden w-100 h-100 object-cover max-w-none -translate-y-1/2 lg:block'
        />
      </div>
    </Section>
  );
};
