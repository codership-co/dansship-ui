import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminScheduleBuilderPage() {
  return <main>AdminScheduleBuilder Page</main>;
}

export const SecureAdminScheduleBuilderPage = SecurityGuard(AdminScheduleBuilderPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminScheduleBuilderPageEnabled],
  orPermissions: AdminPermissions.scheduleBuilder,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
