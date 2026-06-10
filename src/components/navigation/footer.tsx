import { useTranslation } from 'react-i18next';
import { LuInstagram, LuMusic2 } from 'react-icons/lu';
import { Link } from 'react-router';

import { PageContainer } from '@components/containers';
import { Logotype } from '@components/svg';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className='mt-4 rounded-none bg-tertiary text-secondary py-12 shadow-[0_10px_40px_-10px_rgba(88,47,89,0.06)] backdrop-blur-xl'>
      <PageContainer>
        <Logotype className='h-8' mainColor='var(--color-secondary)' />
        <div className='flex flex-col gap-6 md:flex-row md:items-center md:justify-between'>
          <div>
            <p>
              {t('home:sharedFooter.copyright', {
                year: 2026,
                studio: 'Dansship',
              })}
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-x-8 gap-y-2'>
            <Link to='/privacy' className='transition hover:text-primary'>
              {t('home:sharedFooter.legal.privacy')}
            </Link>
            <Link to='/terms' className='transition hover:text-primary'>
              {t('home:sharedFooter.legal.terms')}
            </Link>
            <Link to='/contact' className='transition hover:text-primary'>
              {t('home:sharedFooter.support.contact')}
            </Link>
            <a
              href='https://www.instagram.com/dansship'
              target='_blank'
              rel='noreferrer'
              aria-label={t('home:sharedFooter.social.instagram')}
              className='inline-flex items-center gap-2 font-semibold transition hover:text-primary'
            >
              <LuInstagram className='h-4 w-4' />
              <span>{t('home:sharedFooter.social.instagram')}</span>
            </a>
            <a
              href='https://www.tiktok.com/@dansship'
              target='_blank'
              rel='noreferrer'
              aria-label={t('home:sharedFooter.social.tiktok')}
              className='inline-flex items-center gap-2 font-semibold transition hover:text-primary'
            >
              <LuMusic2 className='h-4 w-4' />
              <span>{t('home:sharedFooter.social.tiktok')}</span>
            </a>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
