import { Button, SmartTable, Tooltip } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { PaymentStatusBadge } from '@components/modules';
import { DansshipAPI, type PaymentStatus } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatDate, formatDateTime, formatPrice, paymentPurchaseLabel } from '@helpers';
import { usePromise } from '@hooks';

interface UserPaymentHistoryProps {
  title?: string;
  statuses?: Array<PaymentStatus>;
  emptyStateKey?: 'payments:emptyState' | 'payments:historicalEmptyState' | 'payments:inProgressEmptyState';
}

export function UserPaymentHistory({
  title,
  statuses,
  emptyStateKey = 'payments:emptyState',
}: UserPaymentHistoryProps) {
  const { t, i18n } = useTranslation();
  const { response: intents, isLoading } = usePromise(() => DansshipAPI.payments.getMyIntents());

  const visibleIntents =
    (statuses ? intents?.data?.filter(intent => statuses.includes(intent.status)) : intents?.data) ?? [];

  if (isLoading) {
    return (
      <section className='grid gap-4'>
        <h4>{title || t('payments:myPayments')}</h4>
        <div className='px-8 py-16 rounded-3xl bg-white/50 grid place-content-center text-center'>
          <SpinnerLoader />
        </div>
      </section>
    );
  }

  if (visibleIntents.length === 0) {
    return (
      <section className='grid gap-4'>
        <h4>{title || t('payments:myPayments')}</h4>
        <section className='px-8 py-16 rounded-3xl bg-white/50 grid place-content-center text-center'>
          <p>{t(emptyStateKey)}</p>
        </section>
      </section>
    );
  }

  return (
    <section className='grid gap-4'>
      <h4>{title || t('payments:myPayments')}</h4>

      <SmartTable
        rowId='id'
        columns={[
          {
            header: t('payments:createdAt'),
            render: row => (
              <Tooltip content={formatDateTime(row.created_at, i18n.language)}>
                <small>{formatDate(row.created_at, i18n.language)}</small>
              </Tooltip>
            ),
            sortBy: 'created_at',
          },
          {
            header: t('payments:name'),
            render: row => <label>{paymentPurchaseLabel(row)}</label>,
          },
          {
            header: t('payments:methodLabel'),
            render: row => <label>{t(`payments:method.${row.payment_method_type}`)}</label>,
            sortBy: 'payment_method_type',
          },
          {
            header: t('payments:ammount'),
            render: row => <label>{formatPrice(row.amount, row.currency)}</label>,
            sortBy: 'amount',
          },
          {
            header: t('payments:intentStatus'),
            render: row => <PaymentStatusBadge status={row.status} />,
            sortBy: 'status',
          },
          {
            header: '',
            render: row => (
              <Link to={`${PageURLS.paymentsResult}?intentId=${row.id}`}>
                <Button color='primary' size='small' variant='flat' className='whitespace-nowrap'>
                  {t('payments:moreDetails')}
                </Button>
              </Link>
            ),
          },
        ]}
        data={visibleIntents}
        className='rounded-3xl'
        tableClassName='bg-white/50'
      />
    </section>
  );
}
