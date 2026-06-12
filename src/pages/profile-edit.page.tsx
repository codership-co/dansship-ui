import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';

function ProfileEditPage() {
  return <main>ProfileEdit Page</main>;
}

export const SecureProfileEditPage = SecurityGuard(ProfileEditPage, {
  featureFlags: [FEATURE_FLAG.isProfileEditPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
