import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminBookingsPage() {
  return <main>AdminBookings Page</main>;
}

export const SecureAdminBookingsPage = SecurityGuard(AdminBookingsPage, {
  featureFlags: [FEATURE_FLAG.isAdminBookingsPageEnabled],
});
