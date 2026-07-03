import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { PaymentStatusBadge, UserPaymentHistory } from '@components/modules';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui';
import { type PaymentStatus } from '@core/api';

const statusMap: Record<string, PaymentStatus> = {
  approved: 'approved',
  rejected: 'rejected',
  pending: 'pending_manual_review',
};

function PaymentsResultPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const orderId = searchParams.get('bold-order-id') ?? '';
  const txStatusRaw = (searchParams.get('bold-tx-status') ?? '').toLowerCase();

  const mappedStatus = useMemo(() => statusMap[txStatusRaw] ?? 'pending_manual_review', [txStatusRaw]);

  return (
    <div className='max-w-4xl mx-auto py-10 px-4 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{t('payments:result.title')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <p className='text-sm text-gray-600'>{t('payments:result.description')}</p>
          {orderId ? (
            <p className='text-xs text-gray-500'>
              {t('payments:reference')}: {orderId}
            </p>
          ) : null}
          <div>
            <PaymentStatusBadge status={mappedStatus} />
          </div>
        </CardContent>
      </Card>

      <UserPaymentHistory
        title={t('payments:result.historyTitle')}
        statuses={['pending_manual_review', 'approved', 'rejected', 'cancelled', 'expired']}
      />
    </div>
  );
}

export const SecurePaymentsResultPage = PaymentsResultPage;
