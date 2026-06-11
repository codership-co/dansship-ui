import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminInventoryPage() {
  return <main>AdminInventory Page</main>;
}

export const SecureAdminInventoryPage = SecurityGuard(AdminInventoryPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminInventoryPageEnabled],
  orPermissions: AdminPermissions.inventory,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
