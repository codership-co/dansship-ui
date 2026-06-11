import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function MyAccountBookingsPage() {
  return <main>MyAccountBookings Page</main>;
}

export const SecureMyAccountBookingsPage = SecurityGuard(MyAccountBookingsPage, {
  featureFlags: [FEATURE_FLAG.isMyAccountBookingsPageEnabled],
});
