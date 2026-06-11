import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function ProfileEditPage() {
  return <main>ProfileEdit Page</main>;
}

export const SecureProfileEditPage = SecurityGuard(ProfileEditPage, {
  featureFlags: [FEATURE_FLAG.isProfileEditPageEnabled],
});
