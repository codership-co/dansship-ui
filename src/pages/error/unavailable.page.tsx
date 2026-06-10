import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ErrorLayout } from '@components/layouts';
import { UnderConstruction } from '@components/svg';
import { Button } from '@components/ui';
import { PageURLS } from '@core/constants';

export function UnavailablePage() {
  const { t } = useTranslation();

  return (
    <main className='relative flex items-center justify-center px-6 pt-20'>
      <ErrorLayout
        hero='Ooops'
        title={t('unavailable:title')}
        description={t('unavailable:description')}
        image={<UnderConstruction className='h-60 mx-auto drop-shadow-[0_0_0_var(--color-secondary)]' />}
        actions={
          <>
            <Link to={PageURLS.home}>
              <Button>{t('unavailable:backToHome')}</Button>
            </Link>

            <Button onClick={() => window.history.back()} variant='outline'>
              {t('unavailable:back')}
            </Button>
          </>
        }
        footer={t('unavailable:joke')}
      />
    </main>
  );
}
