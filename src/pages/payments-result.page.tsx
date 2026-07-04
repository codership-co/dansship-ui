import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useSearchParams } from 'react-router';

import { PaymentStatusBadge, UserPaymentHistory } from '@components/modules';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui';
import { SecurityGuard } from '@contexts';
import { DansshipAPI, type PaymentStatus } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatDate, formatPrice } from '@helpers';
import { usePromise } from '@hooks';

const statusMap: Record<string, PaymentStatus> = {
  approved: 'approved',
  rejected: 'rejected',
  pending: 'pending_manual_review',
};

function PaymentsResultPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { state } = useLocation();

  const intentId = state?.intentId || searchParams.get('intentId') || '';
  const boldOrderId = searchParams.get('bold-order-id') ?? '';
  const txStatusRaw = (searchParams.get('bold-tx-status') ?? '').toLowerCase();

  const { response: intent } = usePromise(() => DansshipAPI.payments.getIntent(intentId), Boolean(intentId));

  const mappedStatus = useMemo(() => statusMap[txStatusRaw] ?? 'pending_manual_review', [txStatusRaw]);

  return (
    <div className='py-10 px-4 space-y-6'>
      <h1>{t('payments:result.title')}</h1>

      {intent && intent.ok && (
        <section className='px-8 max-w-7xl mx-auto'>
          <section className='bg-white py-8 px-16 rounded-2xl grid grid-cols-2 overflow-hidden'>
            <section></section>
            <section className='relative bg-primary text-primary-foreground px-8 py-16 rounded-lg my-20'>
              <h4>{intent.data.purchase_reference?.human_identifier}</h4>
              <section className='grid gap-4 text-center'>
                <section className='bg-primary-200/40 grid p-4 rounded-lg w-5/10'>
                  <p className='m-0 font-bold'>{intent.data.payment_method_type}</p>
                  <small className='m-0'>Method type</small>
                </section>
                <section className='bg-primary-200/40 grid p-4 rounded-lg w-5/10'>
                  <p className='m-0 font-bold'>{formatPrice(intent.data.amount, intent.data.currency)}</p>
                  <small className='m-0'>Ammount</small>
                </section>
                <section className='bg-primary-200/40 grid p-4 rounded-lg w-5/10'>
                  <p className='m-0 font-bold'>{formatDate(intent.data.created_at)}</p>
                  <small className='m-0'>Created</small>
                </section>
              </section>
              <img
                src='/assets/images/bailarina.png'
                alt='Dansship'
                className='absolute w-4/10 bottom-1/2 right-1/20 translate-y-1/2'
              />
            </section>
          </section>
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('payments:result.title')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-sm text-gray-600'>{t('payments:result.description')}</p>
          {boldOrderId ? (
            <p className='text-xs text-gray-500'>
              {t('payments:reference')}: {boldOrderId}
            </p>
          ) : null}
          <div>
            <PaymentStatusBadge status={mappedStatus} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('payments:intentCreatedTitle')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-sm text-gray-600'>{t('payments:intentCreatedDesc')}</p>
          {intent ? (
            <p className='text-xs text-gray-500'>
              {t('payments:reference')}: {intentId}
              <p>{JSON.stringify(intent)}</p>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <UserPaymentHistory
        title={t('payments:result.historyTitle')}
        statuses={['pending_manual_review', 'approved', 'rejected', 'cancelled', 'expired']}
      />
    </div>
  );
}

export const SecurePaymentsResultPage = SecurityGuard(PaymentsResultPage, {
  featureFlags: [],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
