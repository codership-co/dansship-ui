import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminBookingsPage() {
  return <main>AdminBookings Page</main>;
}

export const SecureAdminBookingsPage = SecurityGuard(AdminBookingsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminBookingsPageEnabled],
  orPermissions: AdminPermissions.bookings,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
