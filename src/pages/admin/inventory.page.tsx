import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminInventoryPage() {
  return <main>AdminInventory Page</main>;
}

export const SecureAdminInventoryPage = SecurityGuard(AdminInventoryPage, {
  featureFlags: [FEATURE_FLAG.isAdminInventoryPageEnabled],
});
