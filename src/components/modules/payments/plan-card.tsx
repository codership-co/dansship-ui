import { useTranslation } from 'react-i18next';
import { FaCheckCircle } from 'react-icons/fa';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui';
import { PublicPlan } from '@core/api';
import { cn } from '@helpers';

const getPrice = (value: unknown): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
};

interface PlanCardProps {
  plan: PublicPlan;
  onSelectPlan?: () => void;
  isFeatured?: boolean;
  hoverable?: boolean;
  className?: string;
  asIndividual?: boolean;
}

export function PlanCard({ plan, onSelectPlan, isFeatured, hoverable, className, asIndividual }: PlanCardProps) {
  const { t } = useTranslation();
  const price = getPrice(plan.price);

  return (
    <section key={plan.id} className='group'>
      <Card
        className={cn(
          'relative flex h-auto flex-col',
          isFeatured
            ? 'bg-gradient-plan-recommended text-primary-foreground shadow-[0_2rem_2rem_-1rem_var(--color-primary)] transition-all w-[calc(100%+48px)] -left-6 lg:left-0 lg:w-auto md:-translate-y-8 duration-300 lg:h-full border-0'
            : 'bg-transparent text-secondary-foreground border-0 shadow-none transition-all',
          isFeatured &&
            hoverable &&
            'group-hover:shadow-[0_3rem_2.5rem_-2rem_var(--color-primary)] md:group-hover:-translate-y-10',
          !isFeatured &&
            hoverable &&
            'lg:group-hover:-translate-y-8 lg:group-hover:shadow-[0_2rem_2rem_-1rem_var(--color-secondary-800)] lg:group-hover:bg-gradient-plan-card',
          asIndividual && 'shadow-[0_1rem_2rem_-1rem_#00000055] bg-secondary-400/30',
          className,
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

        <CardContent className='flex grow flex-col pt-0 pb-4 sm:pb-6'>
          {!asIndividual && (
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
          )}

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

        {onSelectPlan && (
          <CardFooter>
            <Button className='w-full' variant={isFeatured ? 'default' : 'outlinePrimary'} onClick={onSelectPlan}>
              {t('subscriptions:choosePlan', { name: plan.name })}
            </Button>
          </CardFooter>
        )}
      </Card>
    </section>
  );
}
