import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminStudioRentalPage() {
  return <main>AdminStudioRental Page</main>;
}

export const SecureAdminStudioRentalPage = SecurityGuard(AdminStudioRentalPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminStudioRentalPageEnabled],
  orPermissions: AdminPermissions.studioRental,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
