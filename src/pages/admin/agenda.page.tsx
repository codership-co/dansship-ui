import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminAgendaPage() {
  return <main>AdminAgenda Page</main>;
}

export const SecureAdminAgendaPage = SecurityGuard(AdminAgendaPage, {
  featureFlags: [FEATURE_FLAG.isAdminAgendaPageEnabled],
});
