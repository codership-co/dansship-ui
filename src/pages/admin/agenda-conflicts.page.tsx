import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminAgendaConflictsPage() {
  return <main>AdminAgendaConflicts Page</main>;
}

export const SecureAdminAgendaConflictsPage = SecurityGuard(AdminAgendaConflictsPage, {
  featureFlags: [FEATURE_FLAG.isAdminAgendaConflictsPageEnabled],
});
