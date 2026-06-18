import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router';

import { CheckoutModal } from './checkout-modal';

import { SpinnerLoader } from '@components/loaders';
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui';
import { useAuth } from '@contexts';
import { DansshipAPI, type PublicPlan } from '@core/api';
import { cn, consumePendingPlanCheckoutIntent, setPendingPlanCheckoutIntent } from '@helpers';
import { usePromise } from '@hooks';

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

export function PlanSelector() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { response: publicPlans, isLoading: isLoadingPublicPlans } = usePromise(() =>
    DansshipAPI.subscriptions.getPublicPlans(),
  );

  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plans = useMemo(() => publicPlans?.data ?? [], [publicPlans?.data]);

  const displayPlans = useMemo(() => orderPlansForDisplay(plans), [plans]);

  const handleSelectPlan = (plan: PublicPlan) => {
    if (!isAuthenticated) {
      setPendingPlanCheckoutIntent(plan.id);
      navigate('/auth/login', { state: { from: location } });

      return;
    }

    setSelectedPlan(plan);
    setIsModalOpen(true);
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

    setSelectedPlan(pendingPlan);
    setIsModalOpen(true);
  }, [isAuthenticated, plans]);

  const getPrice = (value: unknown): number => {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
  };

  if (isLoadingPublicPlans) {
    return <SpinnerLoader />;
  }

  if (displayPlans.length === 0) {
    return (
      <div className='rounded-3xl bg-secondary p-12 text-center'>
        <h3 className='text-lg font-semibold text-foreground'>{t('subscriptions:noPlansAvailable')}</h3>
        <p className='mt-2 text-muted-foreground'>{t('subscriptions:noPlansDesc')}</p>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-2xl mt-16 mx-6 lg:mx-0 lg:px-8 shadow'>
      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {displayPlans.map(plan => {
          const price = getPrice(plan.price);
          const isFeatured = plan.is_recommended === true;

          return (
            <section key={plan.id} className='group'>
              <Card
                className={cn(
                  'relative flex h-auto flex-col',
                  isFeatured
                    ? 'bg-gradient-plan-recommended text-primary-foreground shadow-[0_2rem_2rem_-1rem_var(--color-primary)] group-hover:shadow-[0_3rem_2.5rem_-2rem_var(--color-primary)] transition-all w-[calc(100%+48px)] -left-6 lg:left-0 lg:w-auto md:-translate-y-8 duration-300 md:group-hover:-translate-y-10 lg:h-full border-0'
                    : 'bg-transparent text-secondary-foreground border-0 shadow-none lg:group-hover:-translate-y-8 lg:group-hover:shadow-[0_2rem_2rem_-1rem_var(--color-secondary-800)] lg:group-hover:bg-gradient-plan-card transition-all',
                )}
              >
                {isFeatured && (
                  <div className='pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight px-4 py-1 text-xs font-semibold uppercase text-highlight-foreground'>
                    {t('subscriptions:bestValue')}
                  </div>
                )}

                <CardHeader className='pb-4 pt-5 sm:pb-5 sm:pt-6 gap-0'>
                  <CardTitle className='text-[1.8rem] font-semibold font-title sm:text-[2.1rem]'>{plan.name}</CardTitle>

                  <CardDescription className='text-label'>
                    {plan.description ||
                      t('subscriptions:planDescFallback', {
                        count: plan.classes_included,
                      })}
                  </CardDescription>
                </CardHeader>

                <CardContent className='flex grow flex-col pt-0'>
                  <div className='mb-5 flex items-end gap-1.5 sm:mb-7 sm:gap-2'>
                    <h3 className='font-main m-0'>
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(price)}
                    </h3>

                    <label className='mb-2'>{plan.currency}</label>
                  </div>

                  <ul className='text-label grid gap-4 px-4'>
                    {[
                      t('subscriptions:classesIncluded', { count: plan.classes_included }),
                      t('subscriptions:validForDays', { count: plan.validity_days }),
                      t('subscriptions:accessAllClasses'),
                    ].map((item, i) => (
                      <li key={i} className='flex items-start gap-2.5 sm:gap-3'>
                        <FaCheckCircle className='mt-1 shrink-0 h-4 w-4' />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className='pt-4 sm:pt-6'>
                  <Button
                    className='w-full'
                    variant={isFeatured ? 'default' : 'outlinePrimary'}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {t('subscriptions:choosePlan', { name: plan.name })}
                  </Button>
                </CardFooter>
              </Card>
            </section>
          );
        })}
      </div>

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedPlan={selectedPlan} />
    </div>
  );
}
