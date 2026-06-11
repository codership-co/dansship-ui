import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ErrorLayout } from '@components/layouts';
import { Unauthorized } from '@components/svg';
import { Button } from '@components/ui';
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
            <Button>{t('unauthorized:backToHome')}</Button>
          </Link>

          <Button onClick={() => window.history.back()} variant='outline'>
            {t('unauthorized:back')}
          </Button>
        </>
      }
      footer={t('unauthorized:joke')}
    />
  );
}
