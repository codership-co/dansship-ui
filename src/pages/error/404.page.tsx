import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ErrorLayout } from '@components/layouts';
import { Error404 } from '@components/svg';
import { PageURLS } from '@core/constants';

export function Error404Page() {
  const { t } = useTranslation();

  return (
    <ErrorLayout
      hero='404'
      image={<Error404 className='h-50 mx-auto' />}
      title={t('error404:title')}
      description={t('error404:description')}
      actions={
        <>
          <Link to={PageURLS.home}>
            <Button color='primary'>{t('error404:backToHome')}</Button>
          </Link>

          <Button color='primary' onClick={() => window.history.back()} variant='outlined'>
            {t('error404:back')}
          </Button>
        </>
      }
      footer={t('error404:joke')}
    />
  );
}
