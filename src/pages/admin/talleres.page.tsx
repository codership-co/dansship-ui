import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { TalleresList } from '@components/modules/admin-talleres';
import { Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function AdminTalleresPage() {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.talleresAdmin.list());

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8 pt-20'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>{t('talleres:admin.title')}</h1>
          <p className='mt-2 text-gray-500'>{t('talleres:admin.subtitle')}</p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline'>
            <Link to={PageURLS.admin.tallerComboNew}>{t('talleres:admin.createCombo')}</Link>
          </Button>
          <Button asChild>
            <Link to={PageURLS.admin.tallerNew}>{t('talleres:admin.createWorkshop')}</Link>
          </Button>
        </div>
      </div>
      {isLoading || response === null ? <SpinnerLoader /> : <TalleresList items={response.data ?? []} />}
    </div>
  );
}

export const SecureAdminTalleresPage = SecurityGuard(AdminTalleresPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.talleres,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
