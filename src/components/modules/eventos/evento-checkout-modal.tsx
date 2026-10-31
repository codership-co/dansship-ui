import { ActionModal, Button } from 'polpo/components';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { LuCalendar, LuChevronDown, LuCreditCard, LuInfo, LuList, LuMapPin, LuUser } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { checkoutEventDate, type CheckoutEventDate } from './checkout-event-date';
import { dueLabel, landingHasInstallmentAmounts, paymentNotice } from './installment-notice';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { Badge, Checkbox, Input, Label } from '@components/ui';
import { useAuth, useOrPermissions } from '@contexts';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  PaymentMethod,
  type PaymentPreviewMappedResponse,
  type EventLanding,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { StudentPermissions } from '@core/permissions';
import { cn, formatPrice, setPendingEventoCheckoutIntent } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

enum CheckoutStep {
  REVIEW = 'REVIEW',
  PAY = 'PAY',
}

function sameSequences(left: Array<number>, right: Array<number>) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

const PANE_BODY = 'px-4 pt-4 pb-6 sm:px-8 md:pt-12 md:pr-8 md:pl-12';
const PANE_FOOTER = 'px-4 sm:px-8 md:py-4 md:pr-8 md:pl-12';
const TOTAL_SCOPES = ['recital', 'taller', 'clase_especial'];

interface TicketEvent {
  name: string;
  typeLabel: string;
  date: CheckoutEventDate | null;
  dateLabel: string;
  place: string;
  instructor: string;
}

function EventTicket({ event }: { event: TicketEvent }) {
  const { t } = useTranslation();

  return (
    <section className='flex gap-3.5 rounded-2xl bg-secondary-100 p-3.5'>
      {event.date ? (
        <div
          aria-hidden
          className='grid w-15 shrink-0 content-center justify-items-center gap-1 rounded-xl bg-primary py-2 text-primary-foreground md:w-19'
        >
          <span className='text-[11px] leading-none font-semibold tracking-[0.12em]'>{event.date.weekday}</span>
          <span className='font-title text-[26px] leading-none font-bold md:text-[32px]'>{event.date.day}</span>
          <span className='text-[11px] leading-none font-semibold tracking-[0.12em]'>{event.date.month}</span>
        </div>
      ) : null}
      <div className='grid min-w-0 content-center gap-2'>
        <div className='grid justify-items-start gap-1.5'>
          <Badge variant='outline' size='small'>
            {event.typeLabel}
          </Badge>
          <p className='m-0 font-title text-lg leading-tight font-bold'>{event.name}</p>
        </div>
        <ul className='m-0 grid list-none gap-1 p-0 text-sm'>
          <li className='flex items-start gap-2'>
            <LuCalendar className='mt-0.5 size-4 shrink-0 text-primary' aria-hidden />
            <span>
              <span className='sr-only'>{t('eventos:checkout.dateSr')} </span>
              {event.date?.longLabel ?? event.dateLabel}
            </span>
          </li>
          {event.place ? (
            <li className='flex items-start gap-2'>
              <LuMapPin className='mt-0.5 size-4 shrink-0 text-primary' aria-hidden />
              <span>
                <span className='sr-only'>{t('eventos:checkout.placeSr')} </span>
                {event.place}
              </span>
            </li>
          ) : null}
          {event.instructor ? (
            <li className='flex items-start gap-2'>
              <LuUser className='mt-0.5 size-4 shrink-0 text-primary' aria-hidden />
              <span className='text-muted-foreground'>
                <Trans
                  i18nKey='eventos:checkout.professor'
                  values={{ name: event.instructor }}
                  components={{ strong: <span className='font-semibold text-foreground' /> }}
                />
              </span>
            </li>
          ) : null}
        </ul>
      </div>
    </section>
  );
}

function InstallmentOptionCard({
  title,
  subtitle,
  amount,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string | null;
  amount: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type='button'
      role='radio'
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border-[1.5px] px-4 py-3.5 text-left outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-primary/50',
        selected ? 'border-primary bg-primary/5 ring-[3px] ring-primary/15' : 'border-border bg-white',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-5 shrink-0 place-content-center rounded-full border-2',
          selected ? 'border-primary' : 'border-muted-foreground',
        )}
      >
        {selected ? <span className='size-2.5 rounded-full bg-primary' /> : null}
      </span>
      <span className='grid min-w-0 flex-1 gap-0.5'>
        <span className='font-semibold'>{title}</span>
        {subtitle ? <span className='text-sm text-muted-foreground'>{subtitle}</span> : null}
      </span>
      <span className={cn('font-title text-[21px] leading-none font-bold', selected && 'text-primary')}>{amount}</span>
    </button>
  );
}

function CollapsibleTotal({
  subtitle,
  amount,
  baseAmount,
  taxAmount,
  walletAmountApplied,
}: {
  subtitle: string;
  amount: number;
  baseAmount: number;
  taxAmount: number;
  walletAmountApplied: number;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className='rounded-2xl bg-secondary px-4 py-3.5'>
      <button
        type='button'
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${t('eventos:checkout.totalToPay')}. ${t('eventos:checkout.toggleBreakdown')}`}
        onClick={() => setOpen(current => !current)}
        className='flex w-full items-center justify-between gap-4 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50'
      >
        <span className='grid gap-1'>
          <span className='flex items-center gap-2 font-semibold'>
            {t('eventos:checkout.totalToPay')}
            <span aria-hidden className='grid size-6 place-content-center rounded-full bg-primary/10 text-primary'>
              <LuChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
            </span>
          </span>
          <span className='text-[12.5px] text-secondary-900'>{subtitle}</span>
        </span>
        <span className='font-title text-[28px] leading-none font-bold text-primary'>{formatPrice(amount, 'COP')}</span>
      </button>
      <div id={panelId} hidden={!open} className='mt-3 grid gap-2 border-t border-border pt-3 text-sm'>
        <div className='flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-muted-foreground'>{t('subscriptions:subtotal')}</span>
          <span className='shrink-0'>{formatPrice(baseAmount, 'COP')}</span>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-muted-foreground'>{t('subscriptions:iva')}</span>
          <span className='shrink-0'>{formatPrice(taxAmount, 'COP')}</span>
        </div>
        {walletAmountApplied > 0 ? (
          <div className='flex items-center justify-between gap-2 text-primary'>
            <span className='min-w-0 break-words'>{t('subscriptions:walletApplied')}</span>
            <span className='shrink-0'>-{formatPrice(walletAmountApplied, 'COP')}</span>
          </div>
        ) : null}
        <div className='flex items-center justify-between gap-2 font-bold'>
          <span className='min-w-0 break-words'>{t('subscriptions:totalDue')}</span>
          <span className='shrink-0'>{formatPrice(amount, 'COP')}</span>
        </div>
      </div>
    </div>
  );
}

interface EventoCheckoutModalProps {
  landing: EventLanding;
  accessToken?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EventoCheckoutModal({ landing, accessToken, isOpen, onClose }: EventoCheckoutModalProps) {
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
      <EventoCheckoutContent landing={landing} accessToken={accessToken} onClose={onClose} />
    </ActionModal>
  );
}

function EventoCheckoutContent({
  landing,
  accessToken,
  onClose,
}: {
  landing: EventLanding;
  accessToken?: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canPurchase = useOrPermissions(StudentPermissions.eventos);
  const [step, setStep] = useState(CheckoutStep.REVIEW);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const { response: previewResponse } = usePromise(
    () => DansshipAPI.eventos.previewPricing(landing.slug, accessToken),
    Boolean(isAuthenticated && canPurchase),
    [landing.slug, accessToken],
  );
  const preview = previewResponse?.data as PaymentPreviewMappedResponse | undefined;
  const options = useMemo(() => preview?.installment_options ?? [], [preview]);
  const [chosenSequences, setChosenSequences] = useState<Array<number> | null>(null);

  useEffect(() => {
    if (options.length === 0) {
      setChosenSequences(null);

      return;
    }

    setChosenSequences(current => {
      if (current && options.some(option => sameSequences(option.sequences, current))) {
        return current;
      }

      const partial = options.find(option => option.sequences.length === 1);

      return (partial ?? options[0]).sequences;
    });
  }, [options, preview]);

  const { call: lookupPartner } = useCallablePromise((email: string) => DansshipAPI.eventos.lookupPartner(email));
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  useEffect(() => {
    const email = partnerEmail.trim();

    if (!landing.requires_partner) {
      return;
    }

    if (!email || !email.includes('@')) {
      setPartnerName(null);
      setPartnerError(null);

      return;
    }

    const handle = window.setTimeout(() => {
      void lookupPartner(email)
        .then(result => {
          const data = result.data;

          if (data?.found) {
            setPartnerName(data.display_name);
            setPartnerError(null);
          } else {
            setPartnerName(null);
            setPartnerError(data?.error_code ?? 'PARTNER_NOT_FOUND');
          }
        })
        .catch(() => {
          setPartnerName(null);
          setPartnerError('PARTNER_NOT_FOUND');
        });
    }, 400);

    return () => window.clearTimeout(handle);
  }, [landing.requires_partner, lookupPartner, partnerEmail]);

  const isWalletCovered = Boolean(preview && preview.amount_to_charge === 0 && preview.wallet_amount_applied > 0);
  const partnerValid = !landing.requires_partner || Boolean(partnerName);
  const events = useMemo<Array<TicketEvent>>(
    () =>
      landing.kind === 'combo'
        ? landing.components.map(component => ({
            name: component.name,
            typeLabel: t('eventos:landing.comboBadge'),
            date: checkoutEventDate(component.starts_at),
            dateLabel: component.date_label,
            place: component.room_label,
            instructor: component.instructor_label,
          }))
        : [
            {
              name: landing.name,
              typeLabel: landing.type_label ?? t('eventos:types.taller'),
              date: checkoutEventDate(landing.starts_at),
              dateLabel: landing.date_label ?? '',
              place: landing.room_name || landing.external_location || '',
              instructor: landing.instructor?.name ?? '',
            },
          ],
    [landing, t],
  );

  const handleLogin = () => {
    setPendingEventoCheckoutIntent(landing.slug);
    navigate(PageURLS.auth.login, { state: { from: location } });
  };

  const createIntent = useCallback(async () => {
    if (!preview || !paymentMethod) {
      return null;
    }

    try {
      const selected = options.find(
        option => chosenSequences !== null && sameSequences(option.sequences, chosenSequences),
      );
      const { data, ok } = await DansshipAPI.eventos.createPurchase({
        slug: landing.slug,
        payment_method_type: isWalletCovered ? PaymentMethod.WALLET : paymentMethod,
        partner_email: landing.requires_partner ? partnerEmail.trim() : undefined,
        access_token: accessToken,
        sequences: selected?.sequences,
      });

      if (!ok || !data) {
        toast.error(t('eventos:checkout.createFailed'));

        return null;
      }

      return data.payment_intent_id;
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';

      if (code === DANSSHIP_ERROR_CODE.EVENT_SOLD_OUT) {
        toast.error(t('eventos:checkout.soldOut'));
      } else if (code === DANSSHIP_ERROR_CODE.EVENT_ALREADY_REGISTERED) {
        toast.error(t('eventos:checkout.alreadyRegistered'));
      } else if (code === DANSSHIP_ERROR_CODE.EVENT_INSTALLMENT_OPTION_INVALID) {
        toast.error(t('eventos:checkout.optionUnavailable'));
      } else {
        toast.error(t('eventos:checkout.createFailed'));
      }

      return null;
    }
  }, [
    accessToken,
    chosenSequences,
    isWalletCovered,
    landing.requires_partner,
    landing.slug,
    options,
    partnerEmail,
    paymentMethod,
    preview,
    t,
  ]);

  useEffect(() => {
    if (isWalletCovered) {
      setPaymentMethod(PaymentMethod.WALLET);

      return;
    }

    if (paymentMethod === null || paymentMethod === PaymentMethod.CARD) {
      setPaymentMethod(PaymentMethod.TRANSFER);
    }
  }, [isWalletCovered, paymentMethod]);

  const selectedOption =
    options.find(option => chosenSequences !== null && sameSequences(option.sequences, chosenSequences)) ?? options[0];
  const finalPrice = selectedOption?.amount ?? preview?.final_price ?? 0;
  const baseAmount = selectedOption?.base_amount ?? preview?.base_amount ?? 0;
  const taxAmount = selectedOption?.tax_amount ?? preview?.tax_amount ?? 0;
  const amountToCharge = selectedOption?.amount_to_charge ?? preview?.amount_to_charge ?? 0;
  const hasPlanPrice =
    preview?.discount_type === 'has_active_plan' || preview?.discount_type === 'has_active_plan_min_classes';
  const isPair = landing.kind === 'combo' || landing.requires_partner;
  const priceLabel =
    preview?.discount_type === 'has_active_plan_min_classes'
      ? t(isPair ? 'eventos:checkout.yourPricePlanSizePair' : 'eventos:checkout.yourPricePlanSize')
      : hasPlanPrice
        ? t(isPair ? 'eventos:checkout.yourPricePlanPair' : 'eventos:checkout.yourPricePlan')
        : t('eventos:checkout.yourPrice');
  const notice = paymentNotice(
    {
      kind: landing.kind,
      installmentDueDates: landing.installment_due_dates,
      hasInstallmentAmounts: landingHasInstallmentAmounts(landing.price_rows),
      surface: 'checkout',
    },
    t,
  );
  const dueDates = landing.installment_due_dates ?? [];
  const totalInstallments = dueDates.length;
  const totalOption = options.find(option => option.sequences.length > 1);
  const hasInstallments = totalOption !== undefined;
  const firstInstallmentExpired = hasInstallments && !options.some(option => option.sequences.length === 1);
  const isPartialPayment = selectedOption !== undefined && selectedOption.sequences.length === 1;
  const nextDueDate = isPartialPayment ? dueLabel(dueDates[selectedOption.sequences[0]] ?? '', t) : null;
  const scopeKey = landing.kind === 'combo' ? 'combo' : TOTAL_SCOPES.includes(landing.type ?? '') ? landing.type : null;
  let priceSubLine: string | null;

  if (hasInstallments) {
    priceSubLine =
      isPartialPayment && nextDueDate
        ? t('eventos:checkout.balanceNote', {
            amount: formatPrice(totalOption.amount - selectedOption.amount, 'COP'),
            date: nextDueDate,
            scope: t(`eventos:checkout.totalScope.${scopeKey ?? 'default'}`),
            total: formatPrice(totalOption.amount, 'COP'),
          })
        : hasPlanPrice
          ? t('eventos:checkout.communityRate')
          : null;
  } else {
    priceSubLine = hasPlanPrice ? t('eventos:checkout.communityRateSingle') : t('eventos:checkout.singlePayment');
  }

  const choiceHeadingId = useId();
  const footerClassName = cn(
    'sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:justify-end',
    PANE_FOOTER,
  );

  const reviewForm = (
    <div className='flex min-h-full shrink-0 flex-col'>
      <div className={cn('flex flex-1 flex-col gap-4', PANE_BODY)}>
        {events.map(event => (
          <EventTicket key={event.name} event={event} />
        ))}
        {landing.requires_partner ? (
          <div className='grid gap-2'>
            <Label htmlFor='partner-email'>{t('eventos:checkout.partnerEmail')}</Label>
            <Input
              id='partner-email'
              type='email'
              value={partnerEmail}
              onChange={event => setPartnerEmail(event.target.value)}
            />
            <p
              className={cn(
                'm-0 text-sm',
                partnerError === 'PARTNER_NOT_FOUND' || partnerError === 'PARTNER_SELF_REFERENCE'
                  ? 'text-destructive'
                  : 'text-muted-foreground',
              )}
            >
              {partnerName
                ? t('eventos:checkout.partnerValid', { name: partnerName })
                : partnerError === 'PARTNER_SELF_REFERENCE'
                  ? t('eventos:checkout.partnerSelf')
                  : partnerError === 'PARTNER_NOT_FOUND'
                    ? t('eventos:checkout.partnerNotFound')
                    : t('eventos:checkout.partnerIdle')}
            </p>
          </div>
        ) : null}
        {hasInstallments ? (
          <div className='grid gap-2'>
            <p id={choiceHeadingId} className='m-0 font-semibold'>
              {firstInstallmentExpired ? t('eventos:checkout.yourPayment') : t('eventos:checkout.payChoiceHeading')}
            </p>
            <div role='radiogroup' aria-labelledby={choiceHeadingId} className='grid gap-2'>
              {options.map(option => {
                const isPartial = option.sequences.length === 1;
                const due = isPartial ? dueLabel(dueDates[option.sequences[0] - 1] ?? '', t) : null;

                return (
                  <InstallmentOptionCard
                    key={option.sequences.join('-')}
                    title={
                      isPartial
                        ? t('eventos:checkout.installmentOf', { n: option.sequences[0], total: totalInstallments })
                        : t('eventos:checkout.payTotalTitle')
                    }
                    subtitle={
                      isPartial
                        ? due
                          ? t('eventos:checkout.dueOn', { date: due })
                          : null
                        : t('eventos:checkout.coversInstallments', { count: option.sequences.length })
                    }
                    amount={formatPrice(option.amount, 'COP')}
                    selected={chosenSequences !== null && sameSequences(option.sequences, chosenSequences)}
                    onSelect={() => setChosenSequences(option.sequences)}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
        {preview ? (
          <>
            <div aria-hidden className='flex-1 md:hidden' />
            <div className='flex items-center justify-between gap-4 rounded-2xl bg-secondary px-4 py-3.5'>
              <div className='grid min-w-0 gap-1'>
                <span className='font-semibold'>{hasInstallments ? t('eventos:checkout.payToday') : priceLabel}</span>
                {priceSubLine ? <span className='text-[12.5px] text-secondary-900'>{priceSubLine}</span> : null}
              </div>
              <span className='font-title text-[28px] leading-none font-bold text-primary'>
                {formatPrice(finalPrice, 'COP')}
              </span>
            </div>
            <div aria-hidden className='flex-1 md:hidden' />
          </>
        ) : null}
        {notice ? (
          <div className='flex items-start gap-2.5 text-muted-foreground'>
            <LuInfo className='mt-0.5 size-4 shrink-0' aria-hidden />
            <p className='m-0 text-[12.5px] leading-relaxed font-medium'>{notice}</p>
          </div>
        ) : null}
      </div>
      <div className={footerClassName}>
        <Button type='button' color='primary' variant='outlined' className='flex-1 md:flex-none' onClick={onClose}>
          {t('eventos:checkout.cancel')}
        </Button>
        {!isAuthenticated ? (
          <Button type='button' color='primary' variant='solid' className='flex-1 md:flex-none' onClick={handleLogin}>
            {t('eventos:checkout.loginToReserve')}
          </Button>
        ) : (
          <Button
            type='button'
            color='primary'
            variant='solid'
            className='flex-1 md:flex-none'
            disabled={!partnerValid || !preview}
            onClick={() => setStep(CheckoutStep.PAY)}
          >
            {t('eventos:checkout.next')}
          </Button>
        )}
      </div>
    </div>
  );

  const installmentSummary = isPartialPayment
    ? t('eventos:checkout.installmentOf', { n: selectedOption.sequences[0], total: totalInstallments })
    : hasInstallments
      ? t('eventos:checkout.payTotalTitle')
      : null;
  const vatSummary = t('eventos:checkout.vatIncluded', { amount: formatPrice(taxAmount, 'COP') });

  const payForm = preview ? (
    <div className='flex min-h-full shrink-0 flex-col'>
      <CheckoutPaymentProofForm
        variant='event'
        hideSummary
        paymentMethod={paymentMethod ?? (isWalletCovered ? PaymentMethod.WALLET : PaymentMethod.TRANSFER)}
        finalPrice={finalPrice}
        amountToCharge={amountToCharge}
        walletAmountApplied={preview.wallet_amount_applied}
        confirmLabel={t('eventos:checkout.confirmPay')}
        canConfirm={accepted}
        bodyClassName={cn('flex-1', PANE_BODY)}
        footerClassName={PANE_FOOTER}
        topSlot={
          <CollapsibleTotal
            subtitle={installmentSummary ? `${installmentSummary} · ${vatSummary}` : vatSummary}
            amount={amountToCharge}
            baseAmount={baseAmount}
            taxAmount={taxAmount}
            walletAmountApplied={preview.wallet_amount_applied}
          />
        }
        acceptance={
          <section className='grid gap-2'>
            <p className='m-0 text-[15px] font-semibold'>{t('eventos:checkout.beforeConfirm')}</p>
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-4 py-3.5',
                accepted ? 'border-primary bg-primary/5' : 'border-border bg-white',
              )}
            >
              <Checkbox className='mt-0.5' checked={accepted} onCheckedChange={value => setAccepted(value === true)} />
              <span>{t('eventos:checkout.acceptFinal')}</span>
            </label>
          </section>
        }
        onClose={onClose}
        onBack={() => setStep(CheckoutStep.REVIEW)}
        onCreateIntent={async () => {
          if (!accepted) {
            toast.error(t('eventos:checkout.acceptRequired'));

            return null;
          }

          if (!isWalletCovered && !paymentMethod) {
            return null;
          }

          return createIntent();
        }}
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
    {
      title: t('eventos:checkout.payTitle'),
      subtitle: '',
      step: CheckoutStep.PAY,
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
