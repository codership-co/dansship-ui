import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminStudioRentalPage() {
  return <main>AdminStudioRental Page</main>;
}

export const SecureAdminStudioRentalPage = SecurityGuard(AdminStudioRentalPage, {
  featureFlags: [FEATURE_FLAG.isAdminStudioRentalPageEnabled],
});
