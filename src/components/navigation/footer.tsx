import { useTranslation } from 'react-i18next';
import { LiaFileContractSolid } from 'react-icons/lia';
import { LuInstagram, LuMusic2 } from 'react-icons/lu';
import { MdOutlinePolicy } from 'react-icons/md';
import { RiContactsBook2Line } from 'react-icons/ri';
import { Link } from 'react-router';

import { PageContainer } from '@components/containers';
import { GroovyLayout } from '@components/layouts';
import { Logotype } from '@components/svg';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className='drop-shadow-[0_0.5rem_1em_#00000033]'>
      <GroovyLayout particles={200} background='var(--color-accent)'>
        <PageContainer className='text-accent-foreground py-12'>
          <Logotype className='h-8' mainColor='var(--color-primary)' />
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
              <Link to='/privacy' className='inline-flex items-center gap-2 transition hover:text-primary'>
                <MdOutlinePolicy className='h-4 w-4' />
                {t('home:sharedFooter.legal.privacy')}
              </Link>
              <Link to='/terms' className='inline-flex items-center gap-2 transition hover:text-primary'>
                <LiaFileContractSolid className='h-4 w-4' />
                {t('home:sharedFooter.legal.terms')}
              </Link>
              <Link to='/contact' className='inline-flex items-center gap-2 transition hover:text-primary'>
                <RiContactsBook2Line className='h-4 w-4' />
                {t('home:sharedFooter.support.contact')}
              </Link>
              <a
                href='https://www.instagram.com/dansship'
                target='_blank'
                rel='noreferrer'
                aria-label={t('home:sharedFooter.social.instagram')}
                className='inline-flex items-center gap-2 transition hover:text-primary'
              >
                <LuInstagram className='h-4 w-4' />
                <span>{t('home:sharedFooter.social.instagram')}</span>
              </a>
              <a
                href='https://www.tiktok.com/@dansship'
                target='_blank'
                rel='noreferrer'
                aria-label={t('home:sharedFooter.social.tiktok')}
                className='inline-flex items-center gap-2 transition hover:text-primary'
              >
                <LuMusic2 className='h-4 w-4' />
                <span>{t('home:sharedFooter.social.tiktok')}</span>
              </a>
            </div>
          </div>
        </PageContainer>
      </GroovyLayout>
    </footer>
  );
}
