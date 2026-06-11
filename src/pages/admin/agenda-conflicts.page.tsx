import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminAgendaConflictsPage() {
  return <main>AdminAgendaConflicts Page</main>;
}

export const SecureAdminAgendaConflictsPage = SecurityGuard(AdminAgendaConflictsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminAgendaConflictsPageEnabled],
  orPermissions: AdminPermissions.scheduleBuilder,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
