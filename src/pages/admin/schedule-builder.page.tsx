import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminScheduleBuilderPage() {
  return <main>AdminScheduleBuilder Page</main>;
}

export const SecureAdminScheduleBuilderPage = SecurityGuard(AdminScheduleBuilderPage, {
  featureFlags: [FEATURE_FLAG.isAdminScheduleBuilderPageEnabled],
});
