import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminMerchPosPage() {
  return <main>AdminMerchPos Page</main>;
}

export const SecureAdminMerchPosPage = SecurityGuard(AdminMerchPosPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminMerchPosPageEnabled],
  orPermissions: AdminPermissions.merchPos,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
