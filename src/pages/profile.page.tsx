import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';

function ProfilePage() {
  return <main>Profile Page</main>;
}

export const SecureProfilePage = SecurityGuard(ProfilePage, {
  featureFlags: [FEATURE_FLAG.isProfilePageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
