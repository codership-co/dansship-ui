import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminPaymentsPage() {
  return <main>AdminPayments Page</main>;
}

export const SecureAdminPaymentsPage = SecurityGuard(AdminPaymentsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminPaymentsPageEnabled],
  orPermissions: AdminPermissions.payments,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
