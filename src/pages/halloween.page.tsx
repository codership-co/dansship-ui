import { HalloweenKiosk } from '@components/modules/halloween';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';

export function HalloweenPage() {
  return <HalloweenKiosk />;
}

export const SecureHalloweenPage = SecurityGuard(HalloweenPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: [PERMISSION.HALLOWEEN_WHEEL_MANAGE],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
