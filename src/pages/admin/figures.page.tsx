import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminFiguresPage() {
  return <main>AdminFigures Page</main>;
}

export const SecureAdminFiguresPage = SecurityGuard(AdminFiguresPage, {
  featureFlags: [FEATURE_FLAG.isAdminFiguresPageEnabled],
});
