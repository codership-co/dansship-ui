import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { PaymentStatusBadge } from '@components/modules';
import { PaymentAttempt } from '@core/api';
import { paymentAttemptCardLabel } from '@helpers';
import { useDateLocale } from '@hooks';

interface AdminPaymentAttemptsProps {
  attempts?: Array<PaymentAttempt>;
}

/** Every gateway try (e.g. each Bold payment) of a payment, oldest first. */
export function AdminPaymentAttempts({ attempts }: AdminPaymentAttemptsProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();

  // A single attempt is already described by the payment status above.
  if (!attempts || attempts.length < 2) {
    return null;
  }

  return (
    <div className='space-y-2'>
      <p className='text-sm font-medium text-gray-900'>{t('payments:admin.attempts.title')}</p>
      <ul className='divide-y divide-gray-200 rounded-md border border-gray-200 text-sm text-gray-700'>
        {attempts.map(attempt => (
          <li
            key={`${attempt.gateway_transaction_id ?? 'manual'}-${attempt.processed_at}`}
            className='flex flex-wrap items-center justify-between gap-2 p-3'
          >
            <div>
              <p>{paymentAttemptCardLabel(attempt) ?? t('payments:admin.attempts.noCard')}</p>
              <p className='text-xs text-gray-500'>
                {format(new Date(attempt.processed_at), 'MMM d, yyyy HH:mm', { locale })}
                {attempt.gateway_transaction_id
                  ? ` · ${t('payments:admin.attempts.reference')} ${attempt.gateway_transaction_id}`
                  : ''}
              </p>
            </div>
            <PaymentStatusBadge status={attempt.status} />
          </li>
        ))}
      </ul>
    </div>
  );
}
