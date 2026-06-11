import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function StudioRentalRequestsPage() {
  return <main>StudioRentalRequests Page</main>;
}

export const SecureStudioRentalRequestsPage = SecurityGuard(StudioRentalRequestsPage, {
  featureFlags: [FEATURE_FLAG.isStudioRentalRequestsPageEnabled],
});
