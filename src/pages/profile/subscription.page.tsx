import { format } from 'date-fns';
import { Tabs } from 'polpo/components';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { ActiveSubscriptionWidget, PlanSelector, UserPaymentHistory } from '@components/modules';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI, PaymentStatus, SubscriptionStatus } from '@core/api';
import { PageURLS } from '@core/constants';
import { useDateLocale, usePromise } from '@hooks';

function statusBadgeVariant(status: SubscriptionStatus) {
  if (status === 'active') return 'default' as const;

  if (status === 'pending_payment') return 'outline' as const;

  if (status === 'canceled') return 'destructive' as const;

  return 'secondary' as const;
}

function SubscriptionPage() {
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
    <div className='grid gap-20'>
      <Section navbarPadding>
        <SectionHeading title={t('subscriptions:store.title')} subtitle={t('subscriptions:store.subtitle')} />
        <ActiveSubscriptionWidget />
      </Section>

      <Section>
        <SectionHeading title={t('subscriptions:store.availablePlans')} />
        <PlanSelector plans={publicPlans?.data ?? []} />
      </Section>

      <Section footerMargin>
        <SectionHeading title={t('subscriptions:store.history')} />

        <Tabs defaultOpenTab='inProgressPayments'>
          <Tabs.TabList
            variant='solid'
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
                statuses={[PaymentStatus.PENDING, PaymentStatus.PENDING_MANUAL_REVIEW]}
                emptyStateKey='payments:inProgressEmptyState'
              />
            </div>
          </Tabs.TabPanel>

          <Tabs.TabPanel id='historicalPayments'>
            <div className='mt-4'>
              <UserPaymentHistory
                title={t('subscriptions:store.historicalPayments')}
                statuses={[
                  PaymentStatus.APPROVED,
                  PaymentStatus.REJECTED,
                  PaymentStatus.CANCELLED,
                  PaymentStatus.EXPIRED,
                ]}
                emptyStateKey='payments:historicalEmptyState'
              />
            </div>
          </Tabs.TabPanel>
        </Tabs>
      </Section>
    </div>
  );
}

export const SecureSubscriptionPage = SecurityGuard(SubscriptionPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
