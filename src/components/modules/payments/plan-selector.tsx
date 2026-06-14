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
    <div className='bg-gradient-plan-selector rounded-2xl mt-16 mx-6 lg:mx-0'>
      <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
        {displayPlans.map(plan => {
          const price = getPrice(plan.price);
          const isFeatured = plan.is_recommended === true;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex h-auto flex-col',
                isFeatured
                  ? 'bg-gradient-plan-recommended text-primary shadow-[0_2rem_3rem_-1rem_var(--color-primary)] hover:shadow-[0_3rem_2.7rem_-1.5rem_var(--color-primary)] transition-all w-[calc(100%+48px)] left-[-24px] lg:w-auto md:-translate-y-8 duration-300 md:hover:-translate-y-10 lg:h-full border-0'
                  : 'bg-transparent border-0 shadow-none',
              )}
            >
              {isFeatured && (
                <div className='pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight px-4 py-1 text-xs font-semibold uppercase text-primary'>
                  {t('subscriptions:bestValue')}
                </div>
              )}

              <CardHeader className={cn(isFeatured ? 'pb-4 pt-6 sm:pb-5 sm:pt-8' : 'pb-4 pt-5 sm:pb-5 sm:pt-6')}>
                <CardTitle
                  className={cn(
                    'text-[1.8rem] font-semibold leading-none tracking-tight sm:text-[2.1rem]',
                    isFeatured ? 'text-primary-foreground' : 'text-accent-foreground',
                  )}
                >
                  {plan.name}
                </CardTitle>

                <CardDescription
                  className={cn(
                    'mt-1.5 min-h-0 text-[0.95rem] leading-relaxed sm:mt-2 sm:min-h-12 sm:text-base',
                    isFeatured ? 'text-primary-foreground/80' : 'text-muted-foreground',
                  )}
                >
                  {plan.description ||
                    t('subscriptions:planDescFallback', {
                      count: plan.classes_included,
                    })}
                </CardDescription>
              </CardHeader>

              <CardContent className='flex grow flex-col pt-0'>
                <div className='mb-5 flex items-end gap-1.5 sm:mb-7 sm:gap-2'>
                  <span
                    className={cn(
                      'plan-price-amount text-[3rem] font-extrabold leading-none',
                      isFeatured ? 'text-primary-foreground' : 'text-accent-foreground',
                    )}
                  >
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(price)}
                  </span>

                  <span
                    className={cn(
                      'plan-price-currency mb-0.5 text-base font-medium sm:mb-1 sm:text-[1.2rem]',
                      isFeatured ? 'text-primary-foreground/80' : 'text-muted-foreground',
                    )}
                  >
                    {plan.currency}
                  </span>
                </div>

                <ul className='space-y-3 text-[0.98rem] sm:space-y-4 sm:text-[1.05rem]'>
                  <li
                    className={cn(
                      'flex items-start gap-2.5 sm:gap-3',
                      isFeatured ? 'text-primary-foreground/90' : 'text-muted-foreground',
                    )}
                  >
                    <FaCheckCircle
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5',
                        isFeatured ? 'text-primary-foreground/80' : 'text-primary',
                      )}
                    />

                    <span>
                      <strong>{plan.classes_included}</strong> {t('subscriptions:classesIncluded')}
                    </span>
                  </li>

                  <li
                    className={cn(
                      'flex items-start gap-2.5 sm:gap-3',
                      isFeatured ? 'text-primary-foreground/90' : 'text-muted-foreground',
                    )}
                  >
                    <FaCheckCircle
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5',
                        isFeatured ? 'text-primary-foreground/80' : 'text-primary',
                      )}
                    />

                    <span>
                      {t('subscriptions:validForDays', {
                        count: plan.validity_days,
                      })}
                    </span>
                  </li>

                  <li
                    className={cn(
                      'flex items-start gap-2.5 sm:gap-3',
                      isFeatured ? 'text-primary-foreground/90' : 'text-muted-foreground',
                    )}
                  >
                    <FaCheckCircle
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 sm:h-5 sm:w-5',
                        isFeatured ? 'text-primary-foreground/80' : 'text-primary',
                      )}
                    />

                    <span>{t('subscriptions:accessAllClasses')}</span>
                  </li>
                </ul>
              </CardContent>

              <CardFooter className='pt-4 sm:pt-6'>
                <Button
                  className='w-full'
                  variant={isFeatured ? 'default' : 'secondary'}
                  onClick={() => handleSelectPlan(plan)}
                >
                  {t('subscriptions:choosePlan', { name: plan.name })}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <CheckoutModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedPlan={selectedPlan} />
    </div>
  );
}
