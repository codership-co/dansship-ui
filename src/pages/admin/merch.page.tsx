import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminMerchPage() {
  return <main>AdminMerch Page</main>;
}

export const SecureAdminMerchPage = SecurityGuard(AdminMerchPage, {
  featureFlags: [FEATURE_FLAG.isAdminMerchPageEnabled],
});
