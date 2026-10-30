import { ActionModal, Button } from 'polpo/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCreditCard, LuInfo, LuList } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { landingHasInstallmentAmounts, paymentNotice } from './installment-notice';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { PaymentMethodSelector } from '@components/modules/payments/payment-method-selector';
import { Checkbox, Input, Label } from '@components/ui';
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
  const events = useMemo(
    () =>
      landing.kind === 'combo'
        ? landing.components.map(component => ({
            name: component.name,
            date: component.date_label,
            room: component.room_label,
            instructor: component.instructor_label,
          }))
        : [
            {
              name: landing.name,
              date: [landing.date_label, landing.room_name || landing.external_location].filter(Boolean).join(' · '),
              room: landing.room_name || landing.external_location || '',
              instructor: landing.instructor?.name ?? '',
            },
          ],
    [landing],
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

  const applyPaymentPreview = useCallback((method: PaymentMethod) => {
    setPaymentMethod(method);
  }, []);

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

  const reviewForm = (
    <div className='grid content-start gap-4'>
      {events.map(event => (
        <div key={event.name} className='grid gap-5 rounded-2xl bg-secondary/45 px-5 py-5'>
          <div className='grid gap-1'>
            <p className='m-0 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground'>
              {landing.kind === 'combo'
                ? t('eventos:landing.comboBadge')
                : (landing.type_label ?? t('eventos:types.taller'))}
            </p>
            <p className='m-0 text-[15px] font-semibold'>{event.name}</p>
          </div>
          <div className='grid gap-1'>
            <p className='m-0 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground'>
              {t('eventos:checkout.dateAndRoom')}
            </p>
            <p className='m-0 text-[15px] font-semibold'>{event.date}</p>
          </div>
          <div className='grid gap-1'>
            <p className='m-0 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground'>
              {t('eventos:checkout.instructor')}
            </p>
            <p className='m-0 text-[15px] font-semibold'>{event.instructor}</p>
          </div>
        </div>
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
      {options.length > 1 ? (
        <fieldset className='grid gap-2'>
          <legend className='text-sm font-semibold'>{t('eventos:checkout.payChoice')}</legend>
          {options.map(option => {
            const checked = chosenSequences !== null && sameSequences(option.sequences, chosenSequences);
            const label =
              option.sequences.length > 1
                ? t('eventos:checkout.payTotal')
                : t('eventos:checkout.payInstallment', {
                    ordinal: t(`eventos:landing.installmentOrdinal.${option.sequences[0]}`),
                  });

            return (
              <label
                key={option.sequences.join('-')}
                className={cn(
                  'flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3',
                  checked ? 'border-primary bg-secondary' : 'border-transparent bg-secondary/45',
                )}
              >
                <span className='flex items-center gap-2 text-sm font-semibold'>
                  <input
                    type='radio'
                    name='installment-choice'
                    checked={checked}
                    onChange={() => setChosenSequences(option.sequences)}
                  />
                  {label}
                </span>
                <span className='font-title text-lg leading-none font-bold text-primary'>
                  {formatPrice(option.amount, 'COP')}
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}
      {preview ? (
        <div className='flex items-center justify-between gap-4 rounded-xl bg-secondary px-4 py-3.5'>
          <span className='text-sm font-semibold'>{priceLabel}</span>
          <span className='font-title text-2xl leading-none font-bold text-primary'>
            {formatPrice(finalPrice, 'COP')}
          </span>
        </div>
      ) : null}
      {notice ? (
        <div className='flex items-start gap-2.5 text-muted-foreground'>
          <LuInfo className='mt-0.5 size-4 shrink-0' aria-hidden />
          <p className='m-0 text-[12.5px] leading-relaxed font-medium'>{notice}</p>
        </div>
      ) : null}
      <div className='flex flex-wrap justify-end gap-2'>
        <Button type='button' color='primary' variant='outlined' onClick={onClose}>
          {t('eventos:checkout.cancel')}
        </Button>
        {!isAuthenticated ? (
          <Button type='button' color='primary' variant='solid' onClick={handleLogin}>
            {t('eventos:checkout.loginToReserve')}
          </Button>
        ) : (
          <Button
            type='button'
            color='primary'
            variant='solid'
            disabled={!partnerValid || !preview}
            onClick={() => setStep(CheckoutStep.PAY)}
          >
            {t('eventos:checkout.next')}
          </Button>
        )}
      </div>
    </div>
  );

  const payForm = preview ? (
    <div className='grid content-start gap-4'>
      <div>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:subtotal')}</span>
          <span className='shrink-0'>{formatPrice(baseAmount, 'COP')}</span>
        </div>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:iva')}</span>
          <span className='shrink-0'>{formatPrice(taxAmount, 'COP')}</span>
        </div>
        {preview.wallet_amount_applied > 0 ? (
          <div className='mb-2 flex items-center justify-between gap-2'>
            <span className='min-w-0 break-words text-primary'>{t('subscriptions:walletApplied')}</span>
            <span className='shrink-0 text-primary'>-{formatPrice(preview.wallet_amount_applied, 'COP')}</span>
          </div>
        ) : null}
        <div className='mt-4 flex items-center justify-between gap-2 border-t pt-4 text-lg font-bold'>
          <span className='min-w-0 break-words'>{t('subscriptions:totalDue')}</span>
          <span className='shrink-0'>{formatPrice(amountToCharge, 'COP')}</span>
        </div>
      </div>
      {!isWalletCovered ? (
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={applyPaymentPreview}
          methods={[PaymentMethod.TRANSFER]}
        />
      ) : null}
      <label className='flex items-start gap-3 text-sm'>
        <Checkbox checked={accepted} onCheckedChange={value => setAccepted(value === true)} />
        <span>{t('eventos:checkout.nonRefundableCheckbox')}</span>
      </label>
      <CheckoutPaymentProofForm
        hideSummary
        paymentMethod={paymentMethod ?? (isWalletCovered ? PaymentMethod.WALLET : PaymentMethod.TRANSFER)}
        finalPrice={finalPrice}
        amountToCharge={amountToCharge}
        walletAmountApplied={preview.wallet_amount_applied}
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
    <section className='m-auto h-auto max-w-[100dvw] w-dvw overflow-x-clip border-0 bg-transparent p-0 shadow-none sm:w-[96dvw] sm:max-w-[96dvw] xl:max-w-7xl'>
      <FormStepperLayout
        className={cn(
          'm-auto min-w-0 overflow-x-clip overflow-y-auto rounded-none sm:rounded-xl',
          'w-full max-w-full',
          'h-dvh md:h-[80dvh]',
          'max-h-dvh sm:max-h-[96dvh]',
        )}
        steps={steps}
        currentStep={step}
      />
    </section>
  );
}
