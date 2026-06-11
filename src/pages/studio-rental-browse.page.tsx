import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function StudioRentalBrowsePage() {
  return <main>StudioRentalBrowse Page</main>;
}

export const SecureStudioRentalBrowsePage = SecurityGuard(StudioRentalBrowsePage, {
  featureFlags: [FEATURE_FLAG.isStudioRentalBrowsePageEnabled],
});
