import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { AdminPageLayout } from '@components/layouts';
import { AdminPlanPurchase } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function UserPlanPurchasePage() {
  const { t } = useTranslation();
  const { userId = '' } = useParams<{ userId: string }>();

  return (
    <AdminPageLayout
      title={t('admin:users.registration.purchaseTitle')}
      subtitle={t('admin:users.registration.purchaseSubtitle')}
      dataComponent='admin-user-plan-purchase'
    >
      <AdminPlanPurchase userId={userId} />
    </AdminPageLayout>
  );
}

export const SecureAdminUserPlanPurchasePage = SecurityGuard(UserPlanPurchasePage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.planPurchaseRegistration,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
