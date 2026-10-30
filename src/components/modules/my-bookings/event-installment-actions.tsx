import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { DansshipAPI, PaymentMethod, type MyEventRegistration } from '@core/api';
import { cn, formatPrice } from '@helpers';

function sameSequences(left: Array<number>, right: Array<number>) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

interface EventInstallmentActionsProps {
  registration: MyEventRegistration;
  tone: 'card' | 'hero';
}

export function EventInstallmentActions({ registration, tone }: EventInstallmentActionsProps) {
  const { t } = useTranslation();
  const installments = registration.installments ?? [];
  const options = registration.installment_payment_options ?? [];
  const [paying, setPaying] = useState<Array<number> | null>(null);
  const totalOption = options.find(option => option.sequences.length > 1) ?? null;
  const payingOption = options.find(option => paying !== null && sameSequences(option.sequences, paying)) ?? null;
  const onHero = tone === 'hero';

  if (installments.length === 0) {
    return null;
  }

  return (
    <div className='mt-2 grid gap-2'>
      <ul className='grid gap-1'>
        {installments.map(installment => {
          const solo = options.find(
            option => option.sequences.length === 1 && option.sequences[0] === installment.sequence,
          );

          return (
            <li
              key={installment.sequence}
              className={cn(
                'flex flex-wrap items-center justify-between gap-2',
                onHero ? 'text-[12.5px] text-primary-foreground' : 'text-xs',
              )}
            >
              <span>
                {t('bookings:installmentLine', {
                  sequence: installment.sequence,
                  amount: formatPrice(Number(installment.amount), 'COP'),
                  due: installment.due_date,
                })}{' '}
                · {t(`bookings:installmentStatus.${installment.status}`)}
              </span>
              {solo ? (
                <Button
                  color='primary'
                  variant='outlined'
                  size='small'
                  type='button'
                  className={
                    onHero ? 'border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white' : undefined
                  }
                  onClick={() => setPaying(solo.sequences)}
                >
                  {t('bookings:payInstallment')}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {totalOption ? (
        <Button
          color='primary'
          variant='outlined'
          size='small'
          type='button'
          className={cn(
            'justify-self-start',
            onHero && 'border-white/80 bg-transparent text-white hover:bg-white/10 hover:text-white',
          )}
          onClick={() => setPaying(totalOption.sequences)}
        >
          {t('bookings:payTotal')} · {formatPrice(Number(totalOption.amount), 'COP')}
        </Button>
      ) : null}
      {payingOption ? (
        <CheckoutPaymentProofForm
          paymentMethod={PaymentMethod.TRANSFER}
          finalPrice={Number(payingOption.amount)}
          amountToCharge={Number(payingOption.amount)}
          walletAmountApplied={0}
          onClose={() => setPaying(null)}
          onBack={() => setPaying(null)}
          onSubmit={() => setPaying(null)}
          hideSummary
          onCreateIntent={async () => {
            const { data } = await DansshipAPI.eventos.payInstallments(registration.id, payingOption.sequences);

            return data?.payment_intent_id ?? null;
          }}
        />
      ) : null}
    </div>
  );
}
