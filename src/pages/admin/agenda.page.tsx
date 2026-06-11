import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminAgendaPage() {
  return <main>AdminAgenda Page</main>;
}

export const SecureAdminAgendaPage = SecurityGuard(AdminAgendaPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminAgendaPageEnabled],
  orPermissions: AdminPermissions.scheduleBuilder,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
