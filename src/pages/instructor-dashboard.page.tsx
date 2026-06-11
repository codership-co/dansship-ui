import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function InstructorDashboardPage() {
  return <main>InstructorDashboard Page</main>;
}

export const SecureInstructorDashboardPage = SecurityGuard(InstructorDashboardPage, {
  featureFlags: [FEATURE_FLAG.isInstructorDashboardPageEnabled],
});
