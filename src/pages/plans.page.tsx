import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { PlanSelector } from '@components/modules/payments/plan-selector';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

function PlansPage() {
  const { t } = useTranslation();
  const { response: availablePlans } = usePromise(() => DansshipAPI.subscriptions.getActivePlans());

  return (
    <Section navbarPadding>
      <SectionHeading title={t('subscriptions:store.availablePlans')} subtitle={t('subscriptions:store.subtitle')} />
      <PlanSelector plans={availablePlans?.data ?? []} />
    </Section>
  );
}

export const SecurePlansPage = SecurityGuard(PlansPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
});
