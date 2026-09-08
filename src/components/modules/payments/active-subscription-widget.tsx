import { format, differenceInDays, isFuture } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { LuActivity, LuCalendarDays, LuTicket, LuClock, LuLayers } from 'react-icons/lu';

import { Container, SectionEmpty } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui';
import { type ActiveSubscription, DansshipAPI, type SubscriptionStatus } from '@core/api';
import { resolvePlanDisplayName } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

function statusBadgeVariant(status: SubscriptionStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';

  if (status === 'canceled') return 'destructive';

  if (status === 'pending_payment') return 'outline';

  return 'secondary';
}

function sortSubscriptions(subscriptions: Array<ActiveSubscription>): Array<ActiveSubscription> {
  return [...subscriptions].sort((a, b) => {
    const order: Record<SubscriptionStatus, number> = {
      pending_payment: 0,
      active: 1,
      expired: 3,
      completed: 4,
      canceled: 5,
    };
    const aOrder = a.status === 'active' && isFuture(new Date(a.start_date)) ? 2 : order[a.status];
    const bOrder = b.status === 'active' && isFuture(new Date(b.start_date)) ? 2 : order[b.status];

    if (aOrder !== bOrder) return aOrder - bOrder;

    return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
  });
}

export function ActiveSubscriptionWidget() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response: mySubscriptionsResponse, isLoading } = usePromise(() =>
    DansshipAPI.subscriptions.getMySubscriptions(),
  );
  const subscriptions = mySubscriptionsResponse?.data?.subscriptions ?? [];
  const summary = mySubscriptionsResponse?.data?.summary;
  const currentSubscriptions = subscriptions.filter(sub => sub.status === 'active' || sub.status === 'pending_payment');
  const hasUnlimitedClasses = currentSubscriptions.some(
    sub => sub.status === 'active' && sub.remaining_classes === null,
  );
  const nextBoundedExpiration = currentSubscriptions
    .filter(sub => sub.status === 'active' && sub.remaining_classes !== null)
    .map(sub => new Date(sub.expiration_date).getTime())
    .sort((a, b) => a - b)[0];

  if (isLoading) {
    return (
      <Container>
        <SpinnerLoader />
      </Container>
    );
  }

  if (currentSubscriptions.length === 0) {
    return <SectionEmpty message={t('subscriptions:noSubscriptions')} label={t('subscriptions:noSubscriptionsDesc')} />;
  }

  const sorted = sortSubscriptions(currentSubscriptions);

  return (
    <div className='space-y-6'>
      {/* Summary Section */}
      <Card className='relative overflow-hidden border-secondary/50 shadow-sm'>
        <div className='absolute top-0 left-0 h-full w-2 bg-primary' />

        <CardHeader className='pb-4 pl-8'>
          <CardTitle>
            <span className='flex items-center text-xl'>
              <LuLayers className='mr-2 h-5 w-5 text-primary' />
              {t('subscriptions:summary')}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className='pl-8'>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
            <div className='flex flex-col'>
              <div className='mb-2 flex items-center text-gray-500'>
                <LuTicket className='mr-2 h-4 w-4' />
                <span className='text-sm font-medium'>{t('subscriptions:totalRemaining')}</span>
              </div>

              <span className='text-3xl font-extrabold text-gray-900'>
                {hasUnlimitedClasses ? t('subscriptions:unlimitedClasses') : summary?.total_remaining_classes}
              </span>
            </div>

            <div className='flex flex-col'>
              <div className='mb-2 flex items-center text-gray-500'>
                <LuTicket className='mr-2 h-4 w-4' />
                <span className='text-sm font-medium'>{t('subscriptions:totalBonusClasses')}</span>
              </div>

              <span className='text-3xl font-extrabold text-gray-900'>{summary?.total_bonus_classes ?? 0}</span>
            </div>

            <div className='flex flex-col'>
              <div className='mb-2 flex items-center text-gray-500'>
                <LuActivity className='mr-2 h-4 w-4' />
                <span className='text-sm font-medium'>{t('subscriptions:activePlans')}</span>
              </div>

              <span className='text-3xl font-extrabold text-gray-900'>{summary?.active_count}</span>
            </div>

            <div className='flex flex-col'>
              <div className='mb-2 flex items-center text-gray-500'>
                <LuCalendarDays className='mr-2 h-4 w-4' />
                <span className='text-sm font-medium'>{t('subscriptions:nextExpiration')}</span>
              </div>

              <span className='text-xl font-bold text-gray-900'>
                {nextBoundedExpiration !== undefined
                  ? format(new Date(nextBoundedExpiration), 'MMM d, yyyy', { locale })
                  : hasUnlimitedClasses
                    ? t('subscriptions:noExpiration')
                    : summary?.next_expiration
                      ? format(new Date(summary.next_expiration), 'MMM d, yyyy', { locale })
                      : '—'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Subscription Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {sorted.map(sub => {
          const expDate = new Date(sub.expiration_date);
          const daysLeft = differenceInDays(expDate, new Date());
          const totalClasses = sub.class_count_snapshot;
          const isUnlimited = sub.remaining_classes === null;
          const percentage =
            !isUnlimited && totalClasses !== null && totalClasses > 0
              ? ((sub.remaining_classes ?? 0) / totalClasses) * 100
              : isUnlimited
                ? 100
                : 0;
          const isFutureStart = isFuture(new Date(sub.start_date));

          return (
            <Card key={sub.id} className='relative overflow-hidden border-accent shadow-sm'>
              <CardHeader>
                <CardTitle className='text-lg'>{resolvePlanDisplayName(sub.plan_name_snapshot, t)}</CardTitle>

                <CardDescription className='mt-1'>
                  {sub.class_count_snapshot === null
                    ? t('subscriptions:unlimitedClasses')
                    : `${sub.class_count_snapshot} ${t('subscriptions:classesPackage')}`}
                </CardDescription>
              </CardHeader>

              <CardContent className='space-y-4'>
                <div className='flex flex-wrap gap-2'>
                  {isFutureStart && (
                    <Badge variant='outline' className='border-blue-200 bg-blue-50 text-blue-700'>
                      <LuClock className='mr-1 h-3 w-3' />
                      {t('subscriptions:startsOn', {
                        date: format(new Date(sub.start_date), 'MMM d', { locale }),
                      })}
                    </Badge>
                  )}

                  <Badge variant={statusBadgeVariant(sub.status)}>
                    {sub.status === 'pending_payment' ? t('subscriptions:pendingPayment') : sub.status}
                  </Badge>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex flex-col'>
                    <span className='mb-1 text-sm text-gray-500'>{t('subscriptions:classesRemaining')}</span>

                    <span className='text-2xl font-bold text-gray-900'>
                      {isUnlimited ? t('subscriptions:unlimitedClasses') : sub.remaining_classes}
                    </span>

                    <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100'>
                      <div
                        className={`h-full rounded-full ${
                          !isUnlimited && (sub.remaining_classes ?? 0) <= 1 ? 'bg-alert-500' : 'bg-primary'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <div className='flex flex-col'>
                    <span className='mb-1 text-sm text-gray-500'>{t('subscriptions:expires')}</span>

                    {isUnlimited ? (
                      <span className='text-lg font-bold text-gray-900'>{t('subscriptions:noExpiration')}</span>
                    ) : (
                      <>
                        <span className='text-lg font-bold text-gray-900'>
                          {format(expDate, 'MMM d, yyyy', { locale })}
                        </span>

                        <p className={`mt-1 text-sm font-medium ${daysLeft <= 3 ? 'text-alert-500' : 'text-gray-500'}`}>
                          {daysLeft > 0 ? t('subscriptions:daysLeft', { count: daysLeft }) : t('subscriptions:expired')}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {(sub.bonus_classes_remaining ?? 0) > 0 && (
                  <div className='rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm'>
                    <p className='font-medium text-primary'>
                      {t('subscriptions:bonusClassesRemaining')}: {sub.bonus_classes_remaining}
                    </p>
                    {sub.bonus_expires_at && (
                      <p className='mt-1 text-gray-600'>
                        {t('subscriptions:bonusExpires')}:{' '}
                        {format(new Date(sub.bonus_expires_at), 'MMM d, yyyy', { locale })}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
