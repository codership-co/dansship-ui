import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminPage() {
  return <main>Admin Page</main>;
}

export const SecureAdminPage = SecurityGuard(AdminPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminPageEnabled],
  orPermissions: [
    ...AdminPermissions.access,
    ...AdminPermissions.bookings,
    ...AdminPermissions.figures,
    ...AdminPermissions.inventory,
    ...AdminPermissions.merch,
    ...AdminPermissions.merchPos,
    ...AdminPermissions.payments,
    ...AdminPermissions.reports,
    ...AdminPermissions.scheduleBuilder,
    ...AdminPermissions.studioRental,
  ],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
