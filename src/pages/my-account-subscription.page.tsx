import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function MyAccountSubscriptionPage() {
  return <main>MyAccountSubscription Page</main>;
}

export const SecureMyAccountSubscriptionPage = SecurityGuard(MyAccountSubscriptionPage, {
  featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
});
