import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ErrorLayout } from '@components/layouts/error-layout';
import { UnderConstruction } from '@components/svg';
import { PageURLS } from '@core/constants';

export function UnavailablePage() {
  const { t } = useTranslation();

  return (
    <ErrorLayout
      hero='Ooops'
      title={t('unavailable:title')}
      description={t('unavailable:description')}
      image={<UnderConstruction className='h-60 mx-auto drop-shadow-[0_0_0_var(--color-secondary)]' />}
      actions={
        <>
          <Link to={PageURLS.home}>
            <Button color='primary'>{t('unavailable:backToHome')}</Button>
          </Link>

          <Button color='primary' onClick={() => window.history.back()} variant='outlined'>
            {t('unavailable:back')}
          </Button>
        </>
      }
      footer={t('unavailable:joke')}
    />
  );
}
