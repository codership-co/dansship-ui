import { useTranslation } from 'react-i18next';

import { DoorCodePanel } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminDoorCodePage() {
  const { t } = useTranslation();

  return (
    <div className='mx-auto max-w-3xl px-4 py-8 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:doorCode.title')}</h1>
        <p className='mt-2 text-gray-500'>{t('admin:doorCode.subtitle')}</p>
      </div>

      <DoorCodePanel />
    </div>
  );
}

export const SecureAdminDoorCodePage = SecurityGuard(AdminDoorCodePage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.doorCode,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
