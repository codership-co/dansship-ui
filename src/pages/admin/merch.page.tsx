import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminMerchPage() {
  return <main>AdminMerch Page</main>;
}

export const SecureAdminMerchPage = SecurityGuard(AdminMerchPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminMerchPageEnabled],
  orPermissions: AdminPermissions.merch,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
