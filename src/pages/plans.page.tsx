import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { PromotionBanner } from '@components/modules/home/promotion-banner';
import { PlanSelector } from '@components/modules/payments/plan-selector';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { activePromotionOf } from '@helpers';
import { usePromise } from '@hooks';

function PlansPage() {
  const { t } = useTranslation();
  const { response: availablePlans, isLoading } = usePromise(() => DansshipAPI.subscriptions.getActivePlans());
  const activePromotion = activePromotionOf(availablePlans?.data ?? []);

  return (
    <Section navbarPadding>
      <SectionHeading title={t('subscriptions:store.availablePlans')} subtitle={t('subscriptions:store.subtitle')} />
      {activePromotion ? (
        <div className='mb-8'>
          <PromotionBanner promotion={activePromotion} hideCta />
        </div>
      ) : null}
      <PlanSelector plans={availablePlans?.data ?? []} isLoading={isLoading || availablePlans === null} />
    </Section>
  );
}

export const SecurePlansPage = SecurityGuard(PlansPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
});
