import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminPage() {
  return <main>Admin Page</main>;
}

export const SecureAdminPage = SecurityGuard(AdminPage, {
  featureFlags: [FEATURE_FLAG.isAdminPageEnabled],
});
