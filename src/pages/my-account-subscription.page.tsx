import { format } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown, LuChevronUp } from 'react-icons/lu';

import { ActiveSubscriptionWidget, PlanSelector, UserPaymentHistory } from '@components/modules';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@components/ui';
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
  const [showSubscriptionHistory, setShowSubscriptionHistory] = useState(false);
  const [showInProgressPayments, setShowInProgressPayments] = useState(true);
  const [showHistoricalPayments, setShowHistoricalPayments] = useState(false);

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
    <div className='max-w-6xl mx-auto py-10 px-4'>
      <div className='mb-10'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('subscriptions:store.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('subscriptions:store.subtitle')}</p>
      </div>

      <div className='mb-12'>
        <ActiveSubscriptionWidget />
      </div>

      <div className='mt-12 pt-8 border-t border-gray-200'>
        <h2 className='text-2xl font-bold text-gray-900 mb-6'>{t('subscriptions:store.availablePlans')}</h2>
        <PlanSelector />
      </div>

      <div className='mt-12 border-t border-gray-200 pt-8'>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-between'
          onClick={() => setShowSubscriptionHistory(prev => !prev)}
        >
          <span>{t('subscriptions:store.historicalSubscriptions')}</span>
          <span className='inline-flex items-center gap-1 text-xs'>
            {showSubscriptionHistory ? t('subscriptions:store.collapse') : t('subscriptions:store.expand')}
            {showSubscriptionHistory ? <LuChevronUp className='h-4 w-4' /> : <LuChevronDown className='h-4 w-4' />}
          </span>
        </Button>

        {showSubscriptionHistory ? (
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
        ) : null}
      </div>

      <div className='mt-6 border-t border-gray-200 pt-8'>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-between'
          onClick={() => setShowInProgressPayments(prev => !prev)}
        >
          <span>{t('subscriptions:store.inProgressPayments')}</span>
          <span className='inline-flex items-center gap-1 text-xs'>
            {showInProgressPayments ? t('subscriptions:store.collapse') : t('subscriptions:store.expand')}
            {showInProgressPayments ? <LuChevronUp className='h-4 w-4' /> : <LuChevronDown className='h-4 w-4' />}
          </span>
        </Button>

        {showInProgressPayments ? (
          <div className='mt-4'>
            <UserPaymentHistory
              title={t('subscriptions:store.inProgressPayments')}
              statuses={['pending', 'pending_manual_review']}
              emptyStateKey='payments:inProgressEmptyState'
            />
          </div>
        ) : null}
      </div>

      <div className='mt-6'>
        <Button
          type='button'
          variant='outline'
          className='w-full justify-between'
          onClick={() => setShowHistoricalPayments(prev => !prev)}
        >
          <span>{t('subscriptions:store.historicalPayments')}</span>
          <span className='inline-flex items-center gap-1 text-xs'>
            {showHistoricalPayments ? t('subscriptions:store.collapse') : t('subscriptions:store.expand')}
            {showHistoricalPayments ? <LuChevronUp className='h-4 w-4' /> : <LuChevronDown className='h-4 w-4' />}
          </span>
        </Button>

        {showHistoricalPayments ? (
          <div className='mt-4'>
            <UserPaymentHistory
              title={t('subscriptions:store.historicalPayments')}
              statuses={['approved', 'rejected', 'cancelled', 'expired']}
              emptyStateKey='payments:historicalEmptyState'
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const SecureMyAccountSubscriptionPage = SecurityGuard(MyAccountSubscriptionPage, {
  featureFlags: [FEATURE_FLAG.isMyAccountSubscriptionPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
