import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminFiguresPage() {
  return <main>AdminFigures Page</main>;
}

export const SecureAdminFiguresPage = SecurityGuard(AdminFiguresPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminFiguresPageEnabled],
  orPermissions: AdminPermissions.figures,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
