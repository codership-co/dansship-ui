import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ErrorLayout } from '@components/layouts/error-layout';
import { Unauthorized } from '@components/svg';
import { PageURLS } from '@core/constants';

export function UnauthorizedPage() {
  const { t } = useTranslation();

  return (
    <ErrorLayout
      hero='Ooops'
      title={t('unauthorized:title')}
      description={t('unauthorized:description')}
      image={<Unauthorized className='h-50 mx-auto' />}
      actions={
        <>
          <Link to={PageURLS.home}>
            <Button color='primary'>{t('unauthorized:backToHome')}</Button>
          </Link>

          <Button color='primary' onClick={() => window.history.back()} variant='outlined'>
            {t('unauthorized:back')}
          </Button>
        </>
      }
      footer={t('unauthorized:joke')}
    />
  );
}
