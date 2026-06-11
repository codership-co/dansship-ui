import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminPaymentsPage() {
  return <main>AdminPayments Page</main>;
}

export const SecureAdminPaymentsPage = SecurityGuard(AdminPaymentsPage, {
  featureFlags: [FEATURE_FLAG.isAdminPaymentsPageEnabled],
});
