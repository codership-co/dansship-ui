import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@components/ui';
import { PageURLS } from '@core/constants';

export function Error404Page() {
  const { t } = useTranslation();

  return (
    <main className='relative flex items-center justify-center px-6 pt-20'>
      <div className='absolute inset-0'>
        <div className='bg-primary/20 absolute left-[10%] top-[15%] h-72 w-72 animate-bounce rounded-full blur-3xl duration-6000' />
        <div className='bg-secondary/20 absolute right-[15%] top-[20%] h-96 w-96 animate-pulse rounded-full blur-3xl' />
        <div className='bg-tertiary/20 absolute bottom-[10%] left-[30%] h-80 w-80 animate-bounce rounded-full blur-3xl duration-8000' />
      </div>

      <section className='relative z-10 mx-auto max-w-3xl group'>
        <div className='rounded-4xl p-8 pt-16 text-center shadow-2xl backdrop-blur-xl bg-secondary/30'>
          {/* 404 */}
          <div className='relative mb-4'>
            <h1 className='select-none text-[7rem] font-black tracking-tighter text-primary md:text-[10rem] animate-glitch drop-shadow-[0_0_20px_rgb(var(--color-primary)/0.5)] group-hover:scale-110 group-hover:rotate-3'>
              404
            </h1>

            <div className='bg-tertiary absolute -right-4 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full' />
            <div className='bg-secondary absolute -left-2 top-8 h-4 w-4 rounded-full' />
          </div>

          {/* Title */}
          <h3 className='mb-4 font-bold text-foreground'>{t('error404:title')}</h3>

          {/* Description */}
          <p className='mx-auto mb-8 max-w-xl text-muted-foreground'>{t('error404:description')}</p>

          <div className='flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Link to={PageURLS.home}>
              <Button>{t('error404:backToHome')}</Button>
            </Link>

            <Button onClick={() => window.history.back()} variant='outline'>
              {t('error404:back')}
            </Button>
          </div>

          <p className='mt-8 text-xs opacity-60'>{t('error404:joke')}</p>
        </div>
      </section>
    </main>
  );
}
