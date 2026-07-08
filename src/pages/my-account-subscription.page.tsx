import { format } from 'date-fns';
import { Tabs } from 'polpo/components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { ActiveSubscriptionWidget, PlanSelector, UserPaymentHistory } from '@components/modules';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { useDateLocale, usePromise } from '@hooks';

function statusBadgeVariant(status: 'active' | 'pending_payment' | 'expired' | 'canceled') {
  if (status === 'active') return 'default' as const;

  if (status === 'pending_payment') return 'outline' as const;

  if (status === 'canceled') return 'destructive' as const;

  return 'secondary' as const;
}

function MyAccountSubscriptionPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response: mySubscriptionsResponse } = usePromise(() => DansshipAPI.subscriptions.getMySubscriptions());
  const { response: publicPlans } = usePromise(() => DansshipAPI.subscriptions.getPublicPlans());

  const subscriptions = useMemo(
    () => mySubscriptionsResponse?.data?.subscriptions ?? [],
    [mySubscriptionsResponse?.data?.subscriptions],
  );

  const historicalSubscriptions = useMemo(
    () =>
      subscriptions
        .filter(sub => sub.status === 'expired' || sub.status === 'canceled')
        .sort((a, b) => new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime()),
    [subscriptions],
  );

  return (
    <div className='max-w-7xl mx-auto py-10 px-4'>
      <div className='mb-10'>
        <h4>{t('subscriptions:store.title')}</h4>
        <p>{t('subscriptions:store.subtitle')}</p>
      </div>

      <div className='mb-12'>
        <ActiveSubscriptionWidget />
      </div>

      <div className='mx-auto mt-8 max-w-6xl'>
        <h4>{t('subscriptions:store.availablePlans')}</h4>
        <PlanSelector plans={publicPlans?.data ?? []} />
      </div>

      <section className='mt-20'>
        <Tabs defaultOpenTab='inProgressPayments'>
          <Tabs.TabList
            variant='line'
            color='primary'
            tabs={[
              { id: 'historicalSubscriptions', label: t('subscriptions:store.historicalSubscriptions') },
              { id: 'inProgressPayments', label: t('subscriptions:store.inProgressPayments') },
              { id: 'historicalPayments', label: t('subscriptions:store.historicalPayments') },
            ]}
          />

          <Tabs.TabPanel id='historicalSubscriptions'>
            <Card className='mt-4'>
              <CardHeader>
                <CardTitle>{t('subscriptions:store.historicalSubscriptions')}</CardTitle>
              </CardHeader>

              <CardContent className='space-y-3'>
                {historicalSubscriptions.length === 0 ? (
                  <p className='text-sm text-gray-500'>{t('subscriptions:store.historicalSubscriptionsEmpty')}</p>
                ) : (
                  historicalSubscriptions.map(subscription => (
                    <div key={subscription.id} className='rounded-lg border border-gray-200 p-4'>
                      <div className='flex flex-wrap items-start justify-between gap-2'>
                        <div>
                          <p className='font-semibold text-gray-900'>{subscription.plan_name_snapshot}</p>

                          <p className='text-sm text-gray-600'>
                            {t('subscriptions:store.startedAt')}:{' '}
                            {format(new Date(subscription.start_date), 'MMM d, yyyy', {
                              locale,
                            })}
                          </p>

                          <p className='text-sm text-gray-600'>
                            {t('subscriptions:store.endedAt')}:{' '}
                            {format(new Date(subscription.expiration_date), 'MMM d, yyyy', {
                              locale,
                            })}
                          </p>
                        </div>

                        <Badge variant={statusBadgeVariant(subscription.status)}>
                          {t(`subscriptions:store.status.${subscription.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </Tabs.TabPanel>

          <Tabs.TabPanel id='inProgressPayments'>
            <div className='mt-4'>
              <UserPaymentHistory
                title={t('subscriptions:store.inProgressPayments')}
                statuses={['pending', 'pending_manual_review']}
                emptyStateKey='payments:inProgressEmptyState'
              />
            </div>
          </Tabs.TabPanel>

          <Tabs.TabPanel id='historicalPayments'>
            <div className='mt-4'>
              <UserPaymentHistory
                title={t('subscriptions:store.historicalPayments')}
                statuses={['approved', 'rejected', 'cancelled', 'expired']}
                emptyStateKey='payments:historicalEmptyState'
              />
            </div>
          </Tabs.TabPanel>
        </Tabs>
      </section>
    </div>
  );
}

export const SecureMyAccountSubscriptionPage = SecurityGuard(MyAccountSubscriptionPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
