import { ActionModal, Button } from 'polpo/components';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCreditCard, LuList } from 'react-icons/lu';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

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
  type WorkshopLanding,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { StudentPermissions } from '@core/permissions';
import { cn, formatPrice, setPendingTallerCheckoutIntent } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

enum CheckoutStep {
  REVIEW = 'REVIEW',
  PAY = 'PAY',
}

interface TallerCheckoutModalProps {
  landing: WorkshopLanding;
  isOpen: boolean;
  onClose: () => void;
}

export function TallerCheckoutModal({ landing, isOpen, onClose }: TallerCheckoutModalProps) {
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
      <TallerCheckoutContent landing={landing} onClose={onClose} />
    </ActionModal>
  );
}

function TallerCheckoutContent({ landing, onClose }: { landing: WorkshopLanding; onClose: () => void }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canPurchase = useOrPermissions(StudentPermissions.talleres);
  const [step, setStep] = useState(CheckoutStep.REVIEW);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const { response: previewResponse } = usePromise(
    () => DansshipAPI.talleres.previewPricing(landing.slug),
    Boolean(isAuthenticated && canPurchase),
    [landing.slug],
  );
  const preview = previewResponse?.data as PaymentPreviewMappedResponse | undefined;

  const { call: lookupPartner } = useCallablePromise((email: string) => DansshipAPI.talleres.lookupPartner(email));
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
  const workshops = useMemo(
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
              date: [landing.date_label, landing.room_name].filter(Boolean).join(' · '),
              room: landing.room_name ?? '',
              instructor: landing.instructor?.name ?? '',
            },
          ],
    [landing],
  );

  const handleLogin = () => {
    setPendingTallerCheckoutIntent(landing.slug);
    navigate(PageURLS.auth.login, { state: { from: location } });
  };

  const createIntent = useCallback(async () => {
    if (!preview || !paymentMethod) {
      return null;
    }

    try {
      const { data, ok } = await DansshipAPI.talleres.createPurchase({
        slug: landing.slug,
        payment_method_type: isWalletCovered ? PaymentMethod.WALLET : paymentMethod,
        partner_email: landing.requires_partner ? partnerEmail.trim() : undefined,
      });

      if (!ok || !data) {
        toast.error(t('talleres:checkout.createFailed'));

        return null;
      }

      return data.payment_intent_id;
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';

      if (code === DANSSHIP_ERROR_CODE.WORKSHOP_SOLD_OUT) {
        toast.error(t('talleres:checkout.soldOut'));
      } else if (code === DANSSHIP_ERROR_CODE.WORKSHOP_ALREADY_REGISTERED) {
        toast.error(t('talleres:checkout.alreadyRegistered'));
      } else {
        toast.error(t('talleres:checkout.createFailed'));
      }

      return null;
    }
  }, [isWalletCovered, landing.requires_partner, landing.slug, partnerEmail, paymentMethod, preview, t]);

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

  const reviewForm = (
    <div className='grid gap-6 p-4 sm:p-6'>
      {workshops.map(workshop => (
        <div key={workshop.name} className='rounded-xl border p-4'>
          <p className='m-0 text-xs uppercase text-muted-foreground'>{t('talleres:checkout.workshop')}</p>
          <p className='m-0 font-semibold'>{workshop.name}</p>
          <p className='m-0 mt-2 text-sm'>
            {t('talleres:checkout.dateAndRoom')}: {workshop.date}
          </p>
          <p className='m-0 text-sm'>
            {t('talleres:checkout.instructor')}: {workshop.instructor}
          </p>
        </div>
      ))}
      {landing.requires_partner ? (
        <div className='grid gap-2'>
          <Label htmlFor='partner-email'>{t('talleres:checkout.partnerEmail')}</Label>
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
              ? t('talleres:checkout.partnerValid', { name: partnerName })
              : partnerError === 'PARTNER_SELF_REFERENCE'
                ? t('talleres:checkout.partnerSelf')
                : partnerError === 'PARTNER_NOT_FOUND'
                  ? t('talleres:checkout.partnerNotFound')
                  : t('talleres:checkout.partnerIdle')}
          </p>
        </div>
      ) : null}
      {preview ? (
        <p className='m-0 rounded-full bg-secondary px-4 py-2 font-semibold'>
          {t('talleres:checkout.yourPrice')}: {formatPrice(preview.final_price, 'COP')}
        </p>
      ) : null}
      <label className='flex items-start gap-3 text-sm'>
        <Checkbox checked={accepted} onCheckedChange={value => setAccepted(value === true)} />
        <span>{t('talleres:checkout.nonRefundableCheckbox')}</span>
      </label>
      <div className='flex flex-wrap justify-end gap-2'>
        <Button type='button' color='primary' variant='outlined' onClick={onClose}>
          {t('talleres:checkout.cancel')}
        </Button>
        {!isAuthenticated ? (
          <Button type='button' color='primary' variant='solid' onClick={handleLogin}>
            {t('talleres:checkout.loginToReserve')}
          </Button>
        ) : (
          <Button
            type='button'
            color='primary'
            variant='solid'
            disabled={!partnerValid || !preview || !accepted}
            onClick={() => setStep(CheckoutStep.PAY)}
          >
            {t('talleres:checkout.next')}
          </Button>
        )}
      </div>
    </div>
  );

  const payForm = preview ? (
    <div className='grid gap-6 p-4 sm:p-6'>
      <div>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:subtotal')}</span>
          <span className='shrink-0'>{formatPrice(preview.base_amount, 'COP')}</span>
        </div>
        <div className='mb-2 flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-gray-500'>{t('subscriptions:iva')}</span>
          <span className='shrink-0'>{formatPrice(preview.tax_amount, 'COP')}</span>
        </div>
        {preview.wallet_amount_applied > 0 ? (
          <div className='mb-2 flex items-center justify-between gap-2'>
            <span className='min-w-0 break-words text-primary'>{t('subscriptions:walletApplied')}</span>
            <span className='shrink-0 text-primary'>-{formatPrice(preview.wallet_amount_applied, 'COP')}</span>
          </div>
        ) : null}
        <div className='mt-4 flex items-center justify-between gap-2 border-t pt-4 text-lg font-bold'>
          <span className='min-w-0 break-words'>{t('subscriptions:totalDue')}</span>
          <span className='shrink-0'>{formatPrice(preview.amount_to_charge, 'COP')}</span>
        </div>
      </div>
      {!isWalletCovered ? (
        <PaymentMethodSelector
          value={paymentMethod}
          onChange={applyPaymentPreview}
          methods={[PaymentMethod.TRANSFER]}
        />
      ) : null}
      <CheckoutPaymentProofForm
        hideSummary
        paymentMethod={paymentMethod ?? (isWalletCovered ? PaymentMethod.WALLET : PaymentMethod.TRANSFER)}
        finalPrice={preview.final_price}
        amountToCharge={preview.amount_to_charge}
        walletAmountApplied={preview.wallet_amount_applied}
        onClose={onClose}
        onBack={() => setStep(CheckoutStep.REVIEW)}
        onCreateIntent={async () => {
          if (!accepted || (!isWalletCovered && !paymentMethod)) {
            return null;
          }

          return createIntent();
        }}
        onSubmit={intentId => {
          onClose();
          navigate(`${PageURLS.paymentsResult}?intentId=${intentId}`);
        }}
      />
    </div>
  ) : null;

  const steps = [
    {
      title: t('talleres:checkout.reviewTitle'),
      subtitle: landing.name,
      step: CheckoutStep.REVIEW,
      Icon: LuList,
      form: reviewForm,
    },
    {
      title: t('talleres:checkout.payTitle'),
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
