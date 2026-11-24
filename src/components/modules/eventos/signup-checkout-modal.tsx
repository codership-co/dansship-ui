import { ActionModal, Button } from 'polpo/components';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCreditCard, LuInfo, LuList } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { checkoutEventDate } from './checkout-event-date';
import { EventTicket } from './evento-checkout-modal';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { CollapsibleTotal } from '@components/modules/payments/collapsible-total';
import { PaymentAcceptance } from '@components/modules/payments/payment-acceptance';
import {
  DansshipAPI,
  PaymentMethod,
  participationErrorMessage,
  type EventLanding,
  type SignupApplication,
  type SignupQuote,
  type TicketLine,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatPrice } from '@helpers';
import { usePromise } from '@hooks';

enum CheckoutStep {
  REVIEW = 'REVIEW',
  PAY = 'PAY',
}

const PANE_BODY = 'px-4 pt-4 pb-6 sm:px-8 md:pt-12 md:pr-8 md:pl-12';
const PANE_FOOTER = 'px-4 sm:px-8 md:py-4 md:pr-8 md:pl-12';

export function QuoteLines({ lines }: { lines: Array<TicketLine> }) {
  const { t } = useTranslation();

  return (
    <ul className='m-0 grid list-none gap-1.5 p-0 text-sm'>
      {lines.map(line => (
        <li key={line.index} className='flex justify-between gap-3'>
          <span className='min-w-0 truncate'>
            {line.is_minor ? t('eventos:tickets.minorLine', { name: line.full_name }) : line.full_name}
          </span>
          <span className='shrink-0 font-semibold'>
            {line.price === 0 ? t('eventos:participation.free') : formatPrice(line.price, 'COP')}
          </span>
        </li>
      ))}
    </ul>
  );
}

interface SignupCheckoutModalProps {
  landing: EventLanding;
  isOpen: boolean;
  onClose: () => void;
  /** A paid signup: the body to submit and its quote. */
  application?: SignupApplication | null;
  quote?: SignupQuote | null;
  /** "Volver a pagar": opens the payment step of this purchase. */
  repayPurchaseId?: string | null;
  /** The API refused the signup: the page marks the field it names. */
  onRefused?: (error: unknown) => void;
  /** The admin's "Previsualizar": PAY is shown as the person sees it, but it never submits nor pays. */
  preview?: boolean;
}

/** The existing two-step event checkout (REVIEW, PAY) for any paid signup. */
export function SignupCheckoutModal({ isOpen, onClose, ...props }: SignupCheckoutModalProps) {
  return (
    <ActionModal
      closeOnClickOutside={false}
      windowOffset={0}
      backCard
      lineOnTop
      icon={LuCreditCard}
      isOpen={isOpen}
      onClose={onClose}
      className='w-dvw max-w-[100dvw] overflow-x-clip p-0 rounded-none sm:w-[96dvw] sm:max-w-[96dvw] sm:rounded-xl xl:max-w-7xl'
    >
      {isOpen ? <SignupCheckoutContent onClose={onClose} {...props} /> : null}
    </ActionModal>
  );
}

function SignupCheckoutContent({
  landing,
  application,
  quote,
  repayPurchaseId,
  onClose,
  onRefused,
  preview = false,
}: Omit<SignupCheckoutModalProps, 'isOpen'>) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const repaying = Boolean(repayPurchaseId);
  const [step, setStep] = useState(repaying ? CheckoutStep.PAY : CheckoutStep.REVIEW);
  const [accepted, setAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);
  const { response: repayResponse } = usePromise(
    () => DansshipAPI.participation.getTicketPurchase(repayPurchaseId ?? ''),
    repaying,
    [repayPurchaseId],
  );
  const repayDetail = repayResponse?.data ?? null;
  const lines = repaying ? (repayDetail?.tickets ?? []) : (quote?.lines ?? []);
  const totals = repaying ? (repayDetail?.totals ?? null) : (quote?.totals ?? null);
  const total = quote?.total ?? totals?.final_price ?? 0;
  const payNow = totals?.amount_to_charge ?? total;
  const isWalletCovered = Boolean(totals && totals.amount_to_charge === 0 && totals.wallet_amount_applied > 0);

  useEffect(() => {
    setPaymentMethod(isWalletCovered ? PaymentMethod.WALLET : PaymentMethod.TRANSFER);
  }, [isWalletCovered]);

  const createIntent = async () => {
    if (preview) {
      toast.info(t('eventos:previewMode.payBlocked'));

      return null;
    }

    if (!accepted) {
      toast.error(t('eventos:checkout.acceptRequired'));

      return null;
    }

    const method = isWalletCovered ? PaymentMethod.WALLET : paymentMethod;

    if (repayPurchaseId) {
      const { ok, data, error } = await DansshipAPI.participation.repayTickets(repayPurchaseId, method);

      if (!ok || !data) {
        toast.error(participationErrorMessage(error, t, 'eventos:tickets.quoteFailed'));

        return null;
      }

      return data.payment_intent_id;
    }

    if (!application) return null;

    const { ok, data, error } = await DansshipAPI.participation.submitSignup(landing.slug, {
      ...application,
      payment_method_type: method,
    });

    if (!ok || !data?.payment_intent_id) {
      toast.error(participationErrorMessage(error, t, 'eventos:participation.form.submitFailed'));
      onRefused?.(error);

      return null;
    }

    return data.payment_intent_id;
  };

  const event = useMemo(
    () => ({
      name: landing.name,
      typeLabel: landing.type_label ?? '',
      date: checkoutEventDate(landing.starts_at),
      dateLabel: landing.date_label ?? '',
      place: landing.room_name || landing.external_location || '',
      instructor: '',
    }),
    [landing],
  );
  const footerClassName = cn(
    'sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:justify-end',
    PANE_FOOTER,
  );

  const reviewForm = (
    <div className='flex min-h-full shrink-0 flex-col'>
      <div className={cn('flex flex-1 flex-col gap-4', PANE_BODY)}>
        <EventTicket event={event} />
        <QuoteLines lines={lines} />
        <div className='grid gap-1 rounded-xl border border-border bg-white p-3.5 text-sm'>
          <p className='m-0 flex justify-between gap-3 font-semibold'>
            <span>{t('eventos:checkout.total')}</span>
            <span>{formatPrice(total, 'COP')}</span>
          </p>
          {payNow < total ? (
            <>
              <p className='m-0 flex justify-between gap-3'>
                <span>{t('eventos:checkout.payToday')}</span>
                <span>{formatPrice(payNow, 'COP')}</span>
              </p>
              <p className='m-0 flex justify-between gap-3 text-muted-foreground'>
                <span>{t('eventos:checkout.balanceLater')}</span>
                <span>{formatPrice(total - payNow, 'COP')}</span>
              </p>
            </>
          ) : null}
        </div>
        <div className='flex items-start gap-2.5 text-muted-foreground'>
          <LuInfo className='mt-0.5 size-4 shrink-0' aria-hidden />
          <p className='m-0 text-[12.5px] leading-relaxed font-medium'>{t('eventos:tickets.priceNotice')}</p>
        </div>
      </div>
      <div className={footerClassName}>
        <Button type='button' color='primary' variant='outlined' className='flex-1 md:flex-none' onClick={onClose}>
          {t('eventos:checkout.cancel')}
        </Button>
        <Button
          type='button'
          color='primary'
          variant='solid'
          className='flex-1 md:flex-none'
          onClick={() => setStep(CheckoutStep.PAY)}
        >
          {t('eventos:checkout.next')}
        </Button>
      </div>
    </div>
  );

  const payForm = totals ? (
    <div className='flex min-h-full shrink-0 flex-col'>
      <CheckoutPaymentProofForm
        variant='event'
        hideSummary
        paymentMethod={paymentMethod}
        finalPrice={totals.final_price}
        amountToCharge={totals.amount_to_charge}
        walletAmountApplied={totals.wallet_amount_applied}
        confirmLabel={t('eventos:checkout.confirmPay')}
        canConfirm={accepted && !preview}
        bodyClassName={cn('flex-1', PANE_BODY)}
        footerClassName={PANE_FOOTER}
        topSlot={
          <div className='grid gap-3'>
            {preview ? (
              <p className='m-0 rounded-xl border border-warning-600 bg-warning-50 p-3 text-sm' role='status'>
                {t('eventos:previewMode.payBlocked')}
              </p>
            ) : null}
            {repaying ? (
              <p className='m-0 rounded-xl border border-warning-600 bg-warning-50 p-3 text-sm' role='status'>
                {t('eventos:tickets.repayNotice')}
              </p>
            ) : null}
            <QuoteLines lines={lines} />
            <CollapsibleTotal
              subtitle={t('eventos:tickets.totalSubtitle', {
                count: lines.length,
                vat: formatPrice(totals.tax_amount, 'COP'),
              })}
              amount={totals.amount_to_charge}
              baseAmount={totals.base_amount}
              taxAmount={totals.tax_amount}
              walletAmountApplied={totals.wallet_amount_applied}
            />
          </div>
        }
        acceptance={<PaymentAcceptance accepted={accepted} onAcceptedChange={setAccepted} />}
        onClose={onClose}
        onBack={repaying ? undefined : () => setStep(CheckoutStep.REVIEW)}
        onCreateIntent={createIntent}
        onSubmit={intentId => {
          onClose();
          navigate(`${PageURLS.paymentsResult}?intentId=${intentId}&checkout=1`);
        }}
        paymentQrUrl={landing.payment_qr_url}
      />
    </div>
  ) : null;

  const steps = [
    {
      title: t('eventos:checkout.reviewTitle'),
      subtitle: landing.name,
      step: CheckoutStep.REVIEW,
      Icon: LuList,
      form: reviewForm,
    },
    { title: t('eventos:checkout.payTitle'), subtitle: '', step: CheckoutStep.PAY, Icon: LuCreditCard, form: payForm },
  ];

  return (
    <section className='m-auto h-auto w-full max-w-full overflow-x-clip border-0 bg-transparent p-0 shadow-none sm:w-[96dvw] sm:max-w-[96dvw] xl:max-w-7xl'>
      <FormStepperLayout
        className={cn(
          'm-auto min-w-0 overflow-x-clip overflow-y-auto rounded-none sm:rounded-xl',
          'w-full max-w-full',
          'h-dvh md:h-[80dvh]',
          'max-h-dvh sm:max-h-[96dvh]',
        )}
        steps={steps}
        currentStep={step}
        hideStepHeading
        compactMobileStrip
      />
    </section>
  );
}
