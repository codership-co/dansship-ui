import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { AdminPageLayout } from '@components/layouts';
import { AdminEditUser } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';

function UserEditPage() {
  const { t } = useTranslation();
  const { userId = '' } = useParams<{ userId: string }>();

  return (
    <AdminPageLayout
      title={t('admin:users.registration.editTitle')}
      subtitle={t('admin:users.registration.editSubtitle')}
      dataComponent='admin-user-edit'
    >
      <AdminEditUser userId={userId} />
    </AdminPageLayout>
  );
}

export const SecureAdminUserEditPage = SecurityGuard(UserEditPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  andPermissions: [PERMISSION.USER_MANAGE, PERMISSION.USER_REGISTER],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
