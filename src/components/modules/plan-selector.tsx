import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router';

import { CheckoutModal } from './checkout-modal';

import { BasicSpinnerLoader } from '@components/loaders';
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
  const { response: publicPlans, isLoading: isLoadingPublicPlans } = usePromise(
    DansshipAPI.subscriptions.getPublicPlans,
  );

  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const plans = useMemo(() => publicPlans?.data ?? [], [publicPlans?.data]);

  const displayPlans = useMemo(() => orderPlansForDisplay(plans), [plans]);

  const handleSelectPlan = (plan: PublicPlan) => {
    if (!isAuthenticated) {
      setPendingPlanCheckoutIntent(plan.id);
      navigate('/login', { state: { from: location } });

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
    return (
      <div className='flex justify-center p-12'>
        <BasicSpinnerLoader />
      </div>
    );
  }

  if (displayPlans.length === 0) {
    return (
      <div className='rounded-3xl bg-surface-container-low p-12 text-center'>
        <h3 className='text-lg font-semibold text-foreground'>{t('subscriptions:noPlansAvailable')}</h3>
        <p className='mt-2 text-muted-foreground'>{t('subscriptions:noPlansDesc')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      <div className='grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3'>
        {displayPlans.map(plan => {
          const price = getPrice(plan.price);
          const isFeatured = plan.is_recommended === true;

          return (
            <Card
              key={plan.id}
              className={cn(
                'relative flex h-auto flex-col',
                isFeatured
                  ? 'border-primary/30 bg-primary-container text-primary-foreground shadow-lg transition-transform duration-300 hover:-translate-y-1 lg:-translate-y-4 lg:h-full'
                  : 'border-secondary/50 bg-surface-container-low shadow-none transition-colors duration-200 hover:bg-surface-container lg:h-full',
              )}
            >
              {isFeatured && (
                <div className='pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.06em] text-tertiary-container shadow-[inset_0_0_0_2px_rgba(255,255,255,0.22)]'>
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
                      'plan-price-amount text-[3.25rem] font-extrabold leading-none sm:text-6xl',
                      isFeatured ? 'text-primary-foreground' : 'text-accent-foreground',
                    )}
                  >
                    ${price.toFixed(0)}
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
                  className={cn(
                    'w-full',
                    !isFeatured &&
                      'border border-primary/50 bg-surface-container-lowest text-primary shadow-[0_14px_30px_-24px_rgba(88,47,89,0.55)] hover:bg-surface-container-highest',
                  )}
                  variant={isFeatured ? 'outline' : 'secondary'}
                  size='lg'
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
