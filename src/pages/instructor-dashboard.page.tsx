import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions, InstructorPermissions } from '@core/permissions';

function InstructorDashboardPage() {
  return <main>InstructorDashboard Page</main>;
}

export const SecureInstructorDashboardPage = SecurityGuard(InstructorDashboardPage, {
  featureFlags: [FEATURE_FLAG.isInstructorDashboardPageEnabled],
  orPermissions: [...InstructorPermissions.dashboard, ...AdminPermissions.scheduleBuilder],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
