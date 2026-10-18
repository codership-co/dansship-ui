import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { EventosList } from '@components/modules/admin-eventos';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function AdminEventosPage() {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.eventosAdmin.list());

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8 pt-20'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <SectionHeading className='mb-0' title={t('eventos:admin.title')} subtitle={t('eventos:admin.subtitle')} />
        <div className='flex flex-wrap gap-2'>
          <Link to={PageURLS.admin.eventoComboNew}>
            <Button color='primary' variant='outlined'>
              {t('eventos:admin.createCombo')}
            </Button>
          </Link>
          <Link to={PageURLS.admin.eventoNew}>
            <Button color='primary' variant='solid'>
              {t('eventos:admin.createEvent')}
            </Button>
          </Link>
        </div>
      </div>
      {isLoading || response === null ? <SpinnerLoader /> : <EventosList items={response.data ?? []} />}
    </div>
  );
}

export const SecureAdminEventosPage = SecurityGuard(AdminEventosPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.eventos,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
