import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminReportsPage() {
  return <main>AdminReports Page</main>;
}

export const SecureAdminReportsPage = SecurityGuard(AdminReportsPage, {
  featureFlags: [FEATURE_FLAG.isAdminReportsPageEnabled],
});
