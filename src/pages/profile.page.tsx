import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function ProfilePage() {
  return <main>Profile Page</main>;
}

export const SecureProfilePage = SecurityGuard(ProfilePage, {
  featureFlags: [FEATURE_FLAG.isProfilePageEnabled],
});
