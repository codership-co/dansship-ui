import { useTranslation } from 'react-i18next';

import { AdminPageLayout } from '@components/layouts';
import { UserList } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function UserListPage() {
  const { t } = useTranslation();

  return (
    <AdminPageLayout title={t('admin:users.title')} dataComponent='admin-user-list'>
      <UserList />
    </AdminPageLayout>
  );
}

export const SecureAdminUserListPage = SecurityGuard(UserListPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.users,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
