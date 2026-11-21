import { ActionModal, Button } from 'polpo/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { LuCreditCard, LuInfo, LuList, LuMinus, LuPlus } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { checkoutEventDate } from './checkout-event-date';
import { EventTicket } from './evento-checkout-modal';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { CollapsibleTotal } from '@components/modules/payments/collapsible-total';
import { PaymentAcceptance } from '@components/modules/payments/payment-acceptance';
import { PromotionTermsLink } from '@components/modules/payments/promotion-terms-link';
import { Checkbox, Input, Label } from '@components/ui';
import { useAuth } from '@contexts';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  PaymentMethod,
  participationErrorDetails,
  participationErrorMessage,
  type EventLanding,
  type LandingParticipantType,
  type TicketLine,
  type TicketTotals,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatPrice } from '@helpers';
import { usePromise } from '@hooks';

enum TicketStep {
  REVIEW = 'REVIEW',
  PAY = 'PAY',
}

const PANE_BODY = 'px-4 pt-4 pb-6 sm:px-8 md:pt-12 md:pr-8 md:pl-12';
const PANE_FOOTER = 'px-4 sm:px-8 md:py-4 md:pr-8 md:pl-12';
const SELECT_CLASS = 'h-10 w-full rounded-md border border-input bg-background px-3 text-sm';
const MAX_TICKETS = 50;

export interface TicketDraft {
  full_name: string;
  email: string;
  is_minor: boolean;
  attach_to_index: number | null;
  family_minor_user_id: string | null;
}

export function emptyTicket(): TicketDraft {
  return { full_name: '', email: '', is_minor: false, attach_to_index: null, family_minor_user_id: null };
}

/** Client checks before asking the server; the server stays the source of truth. Returns errors by ticket. */
export function validateTickets(
  tickets: Array<TicketDraft>,
  perAdultMax: number | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): Record<number, string> {
  const errors: Record<number, string> = {};
  const emails = new Map<string, number>();
  const minorsByAdult = new Map<number, number>();

  tickets.forEach((ticket, index) => {
    if (!ticket.full_name.trim()) {
      errors[index] = t('eventos:tickets.nameRequired');

      return;
    }

    if (ticket.is_minor) {
      const target = ticket.attach_to_index;

      if (target === null || tickets[target]?.is_minor !== false) {
        errors[index] = t('eventos:tickets.attachRequired');

        return;
      }

      const count = (minorsByAdult.get(target) ?? 0) + 1;

      minorsByAdult.set(target, count);

      if (perAdultMax !== null && count > perAdultMax) {
        errors[index] = t('errors:codes.EVENT_TICKET_MINORS_LIMIT');
      }

      return;
    }

    const email = ticket.email.trim().toLowerCase();

    if (!email.includes('@')) {
      errors[index] = t('eventos:participation.form.emailInvalid');
    } else if (emails.has(email)) {
      errors[index] = t('eventos:tickets.emailTaken');
    } else {
      emails.set(email, index);
    }
  });

  if (tickets.length > 0 && tickets.every(ticket => ticket.is_minor)) {
    errors[0] = t('errors:codes.EVENT_TICKET_MINORS_ONLY');
  }

  return errors;
}

function payload(tickets: Array<TicketDraft>) {
  return tickets.map(ticket =>
    ticket.is_minor
      ? {
          full_name: ticket.full_name.trim(),
          is_minor: true,
          attach_to_index: ticket.attach_to_index,
          family_minor_user_id: ticket.family_minor_user_id,
        }
      : { full_name: ticket.full_name.trim(), is_minor: false, email: ticket.email.trim() },
  );
}

function TicketLines({ lines }: { lines: Array<TicketLine> }) {
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

interface TicketCheckoutModalProps {
  landing: EventLanding;
  ticketType: LandingParticipantType;
  isOpen: boolean;
  onClose: () => void;
  /** "Volver a pagar": opens the payment step of this purchase. */
  repayPurchaseId?: string | null;
}

/** "Comprar entradas" (ADR-064): the existing two-step event checkout with the "Tus entradas" variant. */
export function TicketCheckoutModal({
  landing,
  ticketType,
  isOpen,
  onClose,
  repayPurchaseId,
}: TicketCheckoutModalProps) {
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
      {isOpen ? (
        <TicketCheckoutContent
          landing={landing}
          ticketType={ticketType}
          onClose={onClose}
          repayPurchaseId={repayPurchaseId ?? null}
        />
      ) : null}
    </ActionModal>
  );
}

function TicketCheckoutContent({
  landing,
  ticketType,
  onClose,
  repayPurchaseId,
}: {
  landing: EventLanding;
  ticketType: LandingParticipantType;
  onClose: () => void;
  repayPurchaseId: string | null;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const repaying = Boolean(repayPurchaseId);
  const [step, setStep] = useState(repaying ? TicketStep.PAY : TicketStep.REVIEW);
  const [tickets, setTickets] = useState<Array<TicketDraft>>([emptyTicket()]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [quoted, setQuoted] = useState<{ lines: Array<TicketLine>; totals: TicketTotals } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.TRANSFER);
  const familyEnabled = Boolean(user?.managedUsersEnabled) && !user?.isManaged && ticketType.minors.allowed;
  const { response: familyResponse } = usePromise(() => DansshipAPI.family.listMine(), familyEnabled);
  const { response: repayResponse } = usePromise(
    () => DansshipAPI.participation.getTicketPurchase(repayPurchaseId ?? ''),
    repaying,
    [repayPurchaseId],
  );
  const repayDetail = repayResponse?.data ?? null;
  const family = (familyResponse?.data?.minors ?? []).filter(
    minor =>
      minor.is_active !== false &&
      (minor.age === null || ticketType.minors.max_age === null || minor.age < ticketType.minors.max_age),
  );
  const maxTickets = Math.max(
    1,
    Math.min(MAX_TICKETS, ticketType.minors.allowed ? MAX_TICKETS : landingRemaining(landing)),
  );
  const lines = repaying ? (repayDetail?.tickets ?? []) : (quoted?.lines ?? []);
  const totals = repaying ? (repayDetail?.totals ?? null) : (quoted?.totals ?? null);
  const isWalletCovered = Boolean(totals && totals.amount_to_charge === 0 && totals.wallet_amount_applied > 0);
  const needsTerms = Boolean(ticketType.terms) && !repaying;

  useEffect(() => {
    setPaymentMethod(isWalletCovered ? PaymentMethod.WALLET : PaymentMethod.TRANSFER);
  }, [isWalletCovered]);

  const update = (index: number, patch: Partial<TicketDraft>) => {
    setQuoted(null);
    setErrors(current => {
      const next = { ...current };
      delete next[index];

      return next;
    });
    setTickets(current => current.map((ticket, itemIndex) => (itemIndex === index ? { ...ticket, ...patch } : ticket)));
  };

  const setCount = (count: number) => {
    setQuoted(null);
    setErrors({});
    setTickets(current => {
      if (count > current.length) {
        return [...current, ...Array.from({ length: count - current.length }, emptyTicket)];
      }

      const kept = current.slice(0, count);

      return kept.map(ticket =>
        ticket.is_minor && ticket.attach_to_index !== null && ticket.attach_to_index >= count
          ? { ...ticket, attach_to_index: null }
          : ticket,
      );
    });
  };

  const applyServerError = useCallback(
    (error: unknown) => {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      const details = participationErrorDetails(error) as { index?: number; indexes?: Array<number> };

      if (code === DANSSHIP_ERROR_CODE.EVENT_TICKET_EMAIL_TAKEN && details.indexes) {
        setErrors(Object.fromEntries(details.indexes.map(index => [index, t('eventos:tickets.emailTaken')])));
        setStep(TicketStep.REVIEW);

        return;
      }

      if (typeof details.index === 'number') {
        setErrors({ [details.index]: participationErrorMessage(error, t, 'eventos:tickets.quoteFailed') });
        setStep(TicketStep.REVIEW);

        return;
      }

      toast.error(participationErrorMessage(error, t, 'eventos:tickets.quoteFailed'));
    },
    [t],
  );

  const next = async () => {
    const found = validateTickets(tickets, ticketType.minors.per_adult_max, t);

    if (Object.keys(found).length > 0) {
      setErrors(found);

      return;
    }

    setQuoting(true);
    try {
      const { ok, data, error } = await DansshipAPI.participation.quoteTickets(landing.slug, {
        participant_type_id: ticketType.id,
        tickets: payload(tickets),
      });

      if (!ok || !data) {
        applyServerError(error);

        return;
      }

      setQuoted({ lines: data.tickets, totals: data.totals });
      setStep(TicketStep.PAY);
    } finally {
      setQuoting(false);
    }
  };

  const createIntent = async () => {
    if (!accepted || (needsTerms && !termsAccepted)) {
      toast.error(t('eventos:checkout.acceptRequired'));

      return null;
    }

    const method = isWalletCovered ? PaymentMethod.WALLET : paymentMethod;
    const { ok, data, error } = repayPurchaseId
      ? await DansshipAPI.participation.repayTickets(repayPurchaseId, method)
      : await DansshipAPI.participation.purchaseTickets(landing.slug, {
          participant_type_id: ticketType.id,
          tickets: payload(tickets),
          payment_method_type: method,
          accepted_terms: termsAccepted,
          terms_version_id: ticketType.terms?.version_id ?? null,
        });

    if (!ok || !data) {
      applyServerError(error);

      return null;
    }

    return data.payment_intent_id;
  };

  const event = useMemo(
    () => ({
      name: landing.name,
      typeLabel: landing.type_label ?? t('eventos:types.showcase'),
      date: checkoutEventDate(landing.starts_at),
      dateLabel: landing.date_label ?? '',
      place: landing.room_name || landing.external_location || '',
      instructor: '',
    }),
    [landing, t],
  );
  const adults = tickets.map((ticket, index) => ({ ticket, index })).filter(item => !item.ticket.is_minor);
  const footerClassName = cn(
    'sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:justify-end',
    PANE_FOOTER,
  );

  const reviewForm = (
    <div className='flex min-h-full shrink-0 flex-col'>
      <div className={cn('flex flex-1 flex-col gap-4', PANE_BODY)}>
        <EventTicket event={event} />
        <div className='flex items-center justify-between gap-3'>
          <div className='grid gap-0.5'>
            <p className='m-0 font-semibold'>{t('eventos:tickets.quantity')}</p>
            <p className='m-0 text-xs text-muted-foreground'>
              {t('eventos:tickets.remaining', { count: landingRemaining(landing) })}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              type='button'
              variant='outlined'
              color='primary'
              aria-label={t('eventos:tickets.less')}
              disabled={tickets.length <= 1}
              onClick={() => setCount(tickets.length - 1)}
            >
              <LuMinus className='size-4' aria-hidden />
            </Button>
            <span className='min-w-8 text-center font-title text-xl font-bold' aria-live='polite'>
              {tickets.length}
            </span>
            <Button
              type='button'
              variant='outlined'
              color='primary'
              aria-label={t('eventos:tickets.more')}
              disabled={tickets.length >= maxTickets}
              onClick={() => setCount(tickets.length + 1)}
            >
              <LuPlus className='size-4' aria-hidden />
            </Button>
          </div>
        </div>
        {tickets.map((ticket, index) => {
          const price = quoted?.lines[index]?.price;

          return (
            <article
              key={index}
              className={cn(
                'grid gap-3 rounded-2xl border bg-white p-3.5',
                errors[index] ? 'border-alert-600' : 'border-border',
              )}
            >
              <div className='flex items-center justify-between gap-2'>
                <p className='m-0 font-semibold'>{t('eventos:tickets.ticket', { number: index + 1 })}</p>
                {price !== undefined ? (
                  <span className='font-semibold text-primary'>
                    {price === 0 ? t('eventos:participation.free') : formatPrice(price, 'COP')}
                  </span>
                ) : null}
              </div>
              {ticketType.minors.allowed && ticketType.minors.max_age ? (
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id={`ticket-minor-${index}`}
                    checked={ticket.is_minor}
                    onCheckedChange={value =>
                      update(index, {
                        is_minor: value === true,
                        email: '',
                        attach_to_index:
                          value === true ? (adults.find(item => item.index !== index)?.index ?? null) : null,
                        family_minor_user_id: null,
                      })
                    }
                  />
                  <Label htmlFor={`ticket-minor-${index}`}>
                    {t('eventos:tickets.isMinor', { age: ticketType.minors.max_age })}
                  </Label>
                </div>
              ) : null}
              {ticket.is_minor ? (
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='grid gap-1.5'>
                    <Label htmlFor={`ticket-name-${index}`}>{t('eventos:tickets.minorName')}</Label>
                    <Input
                      id={`ticket-name-${index}`}
                      value={ticket.full_name}
                      maxLength={150}
                      disabled={Boolean(ticket.family_minor_user_id)}
                      onChange={change => update(index, { full_name: change.target.value })}
                    />
                  </div>
                  <div className='grid gap-1.5'>
                    <Label htmlFor={`ticket-with-${index}`}>{t('eventos:tickets.entersWith')}</Label>
                    <select
                      id={`ticket-with-${index}`}
                      className={SELECT_CLASS}
                      value={ticket.attach_to_index ?? ''}
                      onChange={change =>
                        update(index, {
                          attach_to_index: change.target.value === '' ? null : Number(change.target.value),
                        })
                      }
                    >
                      <option value=''>{t('eventos:tickets.chooseAdult')}</option>
                      {adults.map(item => (
                        <option key={item.index} value={item.index}>
                          {item.ticket.full_name.trim() || t('eventos:tickets.ticket', { number: item.index + 1 })}
                        </option>
                      ))}
                    </select>
                  </div>
                  {family.length > 0 ? (
                    <div className='flex flex-wrap items-center gap-2 sm:col-span-2'>
                      <span className='text-xs text-muted-foreground'>{t('eventos:tickets.fromFamily')}</span>
                      {family.map(minor => (
                        <Button
                          key={minor.user_id}
                          type='button'
                          variant={ticket.family_minor_user_id === minor.user_id ? 'solid' : 'outlined'}
                          color='primary'
                          size='small'
                          disabled={tickets.some(
                            (other, otherIndex) => otherIndex !== index && other.family_minor_user_id === minor.user_id,
                          )}
                          onClick={() =>
                            update(index, {
                              full_name: minor.full_name,
                              family_minor_user_id:
                                ticket.family_minor_user_id === minor.user_id ? null : minor.user_id,
                            })
                          }
                        >
                          {minor.full_name}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                  <p className='m-0 text-xs text-muted-foreground sm:col-span-2'>
                    {t('eventos:tickets.minorHint', { max: ticketType.minors.per_adult_max ?? '' })}
                  </p>
                </div>
              ) : (
                <div className='grid gap-3 sm:grid-cols-2'>
                  <div className='grid gap-1.5'>
                    <Label htmlFor={`ticket-name-${index}`}>{t('eventos:participation.form.fullName')}</Label>
                    <Input
                      id={`ticket-name-${index}`}
                      value={ticket.full_name}
                      maxLength={150}
                      autoComplete='off'
                      onChange={change => update(index, { full_name: change.target.value })}
                    />
                  </div>
                  <div className='grid gap-1.5'>
                    <Label htmlFor={`ticket-email-${index}`}>{t('eventos:tickets.email')}</Label>
                    <Input
                      id={`ticket-email-${index}`}
                      type='email'
                      value={ticket.email}
                      maxLength={255}
                      autoComplete='off'
                      onChange={change => update(index, { email: change.target.value })}
                    />
                  </div>
                </div>
              )}
              {errors[index] ? (
                <p className='m-0 text-sm text-alert-600' role='alert'>
                  {errors[index]}
                </p>
              ) : null}
            </article>
          );
        })}
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
          disabled={quoting}
          onClick={() => void next()}
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
        canConfirm={accepted && (!needsTerms || termsAccepted)}
        bodyClassName={cn('flex-1', PANE_BODY)}
        footerClassName={PANE_FOOTER}
        topSlot={
          <div className='grid gap-3'>
            {repaying ? (
              <p className='m-0 rounded-xl border border-warning-600 bg-warning-50 p-3 text-sm' role='status'>
                {t('eventos:tickets.repayNotice')}
              </p>
            ) : null}
            <TicketLines lines={lines} />
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
        acceptance={
          <div className='grid gap-3'>
            <PaymentAcceptance accepted={accepted} onAcceptedChange={setAccepted} />
            {needsTerms && ticketType.terms ? (
              <div className='flex items-start gap-2'>
                <Checkbox
                  id='ticket-terms'
                  checked={termsAccepted}
                  onCheckedChange={value => setTermsAccepted(value === true)}
                />
                <Label htmlFor='ticket-terms' className='leading-snug'>
                  <Trans
                    i18nKey='eventos:tickets.terms'
                    components={{ LinkTerms: <PromotionTermsLink terms={ticketType.terms} /> }}
                  />
                </Label>
              </div>
            ) : null}
          </div>
        }
        onClose={onClose}
        onBack={repaying ? undefined : () => setStep(TicketStep.REVIEW)}
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
      title: t('eventos:tickets.reviewTitle'),
      subtitle: landing.name,
      step: TicketStep.REVIEW,
      Icon: LuList,
      form: reviewForm,
    },
    {
      title: t('eventos:checkout.payTitle'),
      subtitle: '',
      step: TicketStep.PAY,
      Icon: LuCreditCard,
      form: payForm,
    },
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

function landingRemaining(landing: EventLanding): number {
  return landing.participation?.remaining ?? landing.remaining;
}
