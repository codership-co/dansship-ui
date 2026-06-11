import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminAccessPage() {
  return <main>AdminAccess Page</main>;
}

export const SecureAdminAccessPage = SecurityGuard(AdminAccessPage, {
  featureFlags: [FEATURE_FLAG.isAdminAccessPageEnabled],
});
