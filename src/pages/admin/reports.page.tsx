import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminReportsPage() {
  return <main>AdminReports Page</main>;
}

export const SecureAdminReportsPage = SecurityGuard(AdminReportsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminReportsPageEnabled],
  orPermissions: AdminPermissions.reports,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
