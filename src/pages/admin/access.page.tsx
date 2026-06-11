import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminAccessPage() {
  return <main>AdminAccess Page</main>;
}

export const SecureAdminAccessPage = SecurityGuard(AdminAccessPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminAccessPageEnabled],
  orPermissions: AdminPermissions.access,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
