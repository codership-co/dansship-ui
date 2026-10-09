import { useTranslation } from 'react-i18next';

import { AdminPageLayout } from '@components/layouts';
import { AdminRegisterUser } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function UserRegisterPage() {
  const { t } = useTranslation();

  return (
    <AdminPageLayout
      title={t('admin:users.registration.title')}
      subtitle={t('admin:users.registration.subtitle')}
      dataComponent='admin-user-register'
    >
      <AdminRegisterUser />
    </AdminPageLayout>
  );
}

export const SecureAdminUserRegisterPage = SecurityGuard(UserRegisterPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.userRegistration,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
