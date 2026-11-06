import { useTranslation } from 'react-i18next';

import { AdminPageLayout } from '@components/layouts';
import { AssistedPage } from '@components/modules/admin-assisted';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AssistedPagePermissions } from '@core/permissions';

function AdminAssistedPage() {
  const { t } = useTranslation('assisted');

  return (
    <AdminPageLayout title={t('page.title')} subtitle={t('page.subtitle')} dataComponent='admin-assisted'>
      <AssistedPage />
    </AdminPageLayout>
  );
}

export const SecureAdminAssistedPage = SecurityGuard(AdminAssistedPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AssistedPagePermissions,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
