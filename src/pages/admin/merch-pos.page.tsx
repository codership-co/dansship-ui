import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function AdminMerchPosPage() {
  return <main>AdminMerchPos Page</main>;
}

export const SecureAdminMerchPosPage = SecurityGuard(AdminMerchPosPage, {
  featureFlags: [FEATURE_FLAG.isAdminMerchPosPageEnabled],
});
