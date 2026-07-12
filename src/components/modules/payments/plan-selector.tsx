import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { CheckoutModal } from './checkout-modal';

import { PlanCard } from '@components/modules';
import { useAuth } from '@contexts';
import { type PublicPlan } from '@core/api';
import { PageURLS } from '@core/constants';
import {
  clearPendingPlanCheckoutIntent,
  consumePendingPlanCheckoutIntent,
  setPendingPlanCheckoutIntent,
} from '@helpers';

const orderPlansForDisplay = (plans: Array<PublicPlan>): Array<PublicPlan> => {
  const recommendedPlans = plans.filter(plan => plan.is_recommended === true);

  if (recommendedPlans.length !== 1 || plans.length < 3) {
    return plans;
  }

  const featuredPlan = recommendedPlans[0];
  const remainingPlans = plans.filter(plan => plan.id !== featuredPlan.id);
  const middleIndex = Math.floor(remainingPlans.length / 2);

  return [...remainingPlans.slice(0, middleIndex), featuredPlan, ...remainingPlans.slice(middleIndex)];
};

interface PlanSelectorProps {
  plans: Array<PublicPlan>;
}

export function PlanSelector({ plans }: PlanSelectorProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [isOpen, setOpen] = useState(false);

  const displayPlans = useMemo(() => orderPlansForDisplay(plans), [plans]);

  const handleSelectPlan = (plan: PublicPlan) => {
    if (!isAuthenticated) {
      setPendingPlanCheckoutIntent(plan.id);
      navigate(PageURLS.auth.login, { state: { from: location } });

      return;
    }

    setOpen(true);
    setSelectedPlan(plan);
  };

  useEffect(() => {
    if (!isAuthenticated || plans.length === 0) {
      return;
    }

    const pendingPlanId = consumePendingPlanCheckoutIntent();

    if (!pendingPlanId) {
      return;
    }

    const pendingPlan = plans.find(plan => plan.id === pendingPlanId);

    if (!pendingPlan) {
      return;
    }

    setOpen(true);
    setSelectedPlan(pendingPlan);
  }, [isAuthenticated, plans]);

  if (displayPlans.length === 0) {
    return (
      <div className='rounded-3xl bg-secondary/50 p-12 text-center'>
        <h4>{t('subscriptions:noPlansAvailable')}</h4>
        <p className='mt-2'>{t('subscriptions:noPlansDesc')}</p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-2xl mt-16 mx-6 lg:mx-0 lg:px-8 shadow'>
      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {displayPlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            onSelectPlan={() => handleSelectPlan(plan)}
            isFeatured={plan.is_recommended}
            hoverable
          />
        ))}
      </div>

      {selectedPlan && (
        <CheckoutModal
          plan={selectedPlan}
          isOpen={isOpen}
          onClose={() => {
            setOpen(false);
            clearPendingPlanCheckoutIntent();
          }}
        />
      )}
    </div>
  );
}
