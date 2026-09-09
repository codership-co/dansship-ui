import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';

import { CheckoutModal } from './checkout-modal';
import { PlanCard } from './plan-card';

import { useAuth } from '@contexts';
import { type PublicPlan } from '@core/api';
import { PageURLS } from '@core/constants';
import {
  clearPendingPlanCheckoutIntent,
  cn,
  consumePendingPlanCheckoutIntent,
  setPendingPlanCheckoutIntent,
} from '@helpers';

interface PlanSelectorProps {
  plans: Array<PublicPlan>;
  isLoading?: boolean;
}

function Bone({ className }: { className?: string }) {
  return <div className={cn('rounded-md bg-secondary', className)} />;
}

function PurpleBone({ className }: { className?: string }) {
  return <div className={cn('rounded-md bg-primary/15', className)} />;
}

function PlanCardSkeleton({ delayMs, className }: { delayMs: number; className?: string }) {
  return (
    <div
      className={cn('flex animate-pulse flex-col gap-5 py-6 sm:gap-6', className)}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className='grid gap-2.5 px-6'>
        <PurpleBone className='h-[26px] w-[62%] rounded-lg sm:h-[30px]' />
        <Bone className='h-3 w-[88%] sm:h-[13px]' />
      </div>
      <div className='grid gap-2 px-6'>
        <div className='flex items-end gap-2'>
          <PurpleBone className='h-[38px] w-[55%] rounded-[10px] sm:h-11' />
          <Bone className='mb-1 h-3.5 w-8 sm:h-4 sm:w-[34px]' />
        </div>
        <Bone className='ml-7 h-2 w-[88px] sm:h-2.5 sm:w-24' />
      </div>
      <div className='grid gap-3.5 px-10 sm:gap-4'>
        <Bone className='h-3 w-full sm:h-[13px]' />
        <Bone className='h-3 w-4/5 sm:h-[13px]' />
        <Bone className='h-3 w-[90%] sm:h-[13px]' />
        <Bone className='hidden h-[13px] w-[70%] xl:block' />
      </div>
      <div className='mt-auto px-6 pt-2 sm:pt-4'>
        <PurpleBone className='h-10 w-full rounded-[10px]' />
      </div>
    </div>
  );
}

function PlanSelectorSkeleton() {
  return (
    <div className='mt-16 mx-6 overflow-x-clip rounded-2xl bg-white shadow lg:mx-0 lg:px-8' aria-hidden>
      <div className='grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3'>
        <PlanCardSkeleton delayMs={0} />
        <PlanCardSkeleton delayMs={120} />
        <PlanCardSkeleton delayMs={240} className='hidden md:flex' />
      </div>
    </div>
  );
}

export function PlanSelector({ plans, isLoading = false }: PlanSelectorProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [isOpen, setOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div aria-busy='true' aria-label={t('common:loading')}>
        <PlanSelectorSkeleton />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className='rounded-3xl bg-secondary/50 p-12 text-center'>
        <h4>{t('subscriptions:noPlansAvailable')}</h4>
        <p className='mt-2'>{t('subscriptions:noPlansDesc')}</p>
      </div>
    );
  }

  return (
    <div className='mt-16 mx-6 overflow-x-clip rounded-2xl bg-white shadow lg:mx-0 lg:px-8'>
      <div className='grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3'>
        {plans.map(plan => (
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
