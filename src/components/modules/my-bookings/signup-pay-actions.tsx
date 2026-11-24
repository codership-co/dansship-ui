import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import {
  PaymentMethod,
  nextPayableSequences,
  participationErrorMessage,
  toNumber,
  type MyParticipationRow,
} from '@core/api';
import { formatPrice } from '@helpers';
import { useSignupPayment } from '@hooks';

/** The label of "Pagar" by what the API says it opens now (`pay_action`). */
export function payActionLabel(
  row: Pick<MyParticipationRow, 'pay_action' | 'installments'>,
  t: (key: string) => string,
) {
  if (row.pay_action === 'pay_deposit') return t('bookings:participation.payDeposit');

  if (row.pay_action === 'pay') {
    return (row.installments?.length ?? 0) > 0
      ? t('bookings:participation.payNextInstallment')
      : t('bookings:participation.pay');
  }

  return null;
}

/**
 * A signup's installments and its "Pagar" action. No action unless the API offers one:
 * a paid signup in review, a confirmed one with nothing due, or one already paying shows none.
 */
export function SignupPayActions({ row }: { row: MyParticipationRow }) {
  const { t } = useTranslation();
  const { openPayment, usesInstallments } = useSignupPayment(row);
  const [amount, setAmount] = useState<number | null>(null);
  const label = payActionLabel(row, t);
  const installments = row.installments ?? [];

  return (
    <div className='mt-2 grid gap-2'>
      {installments.length > 0 ? (
        <ul className='m-0 grid list-none gap-1 p-0'>
          {installments.map(line => (
            <li key={line.sequence} className='text-xs text-muted-foreground'>
              {t('bookings:installmentLine', {
                sequence: line.sequence,
                amount: formatPrice(toNumber(line.amount), 'COP'),
                due: line.due_date,
              })}{' '}
              · {t(`bookings:participation.installmentStatus.${line.status}`)}
            </li>
          ))}
        </ul>
      ) : null}
      {label && amount === null ? (
        <Button
          color='primary'
          variant='solid'
          size='small'
          type='button'
          className='justify-self-start'
          onClick={() => {
            // The lines this payment covers; a payment without a plan is priced by the API when it opens.
            const sequences = usesInstallments ? nextPayableSequences(row) : [];

            setAmount(
              installments
                .filter(line => sequences.includes(line.sequence))
                .reduce((total, line) => total + toNumber(line.amount), 0),
            );
          }}
        >
          {label}
        </Button>
      ) : null}
      {amount !== null ? (
        <CheckoutPaymentProofForm
          paymentMethod={PaymentMethod.TRANSFER}
          finalPrice={amount}
          amountToCharge={amount}
          walletAmountApplied={0}
          hideSummary
          onClose={() => setAmount(null)}
          onBack={() => setAmount(null)}
          onSubmit={() => {
            setAmount(null);
            toast.success(t('bookings:participation.paymentSent'));
          }}
          onCreateIntent={async () => {
            const result = await openPayment(PaymentMethod.TRANSFER);

            if (!result?.ok) {
              toast.error(participationErrorMessage(result?.error, t, 'bookings:participation.payFailed'));

              return null;
            }

            return result.data.payment_intent_id;
          }}
        />
      ) : null}
    </div>
  );
}
