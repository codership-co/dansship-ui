import { ActionModal } from 'polpo/components';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCreditCard, LuGift, LuList, LuReceipt } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { CheckoutGiftDetailsForm } from '@components/forms/checkout-gift-details-form';
import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { CheckoutPurchaseModeForm } from '@components/forms/checkout-purchase-mode-form';
import {
  CheckoutFormValues,
  CheckoutPayForm,
  defaultCheckoutFormValues,
  DefaultPaymentData,
  PaymentData,
} from '@components/forms/checkout-review-plan-form';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { PaymentMethod, type PublicPlan } from '@core/api';
import { PageURLS } from '@core/constants';
import { addSentryBreadcrumb } from '@core/sentry';
import { cn } from '@helpers';

export enum CheckoutStep {
  MODE = 'MODE',
  GIFT = 'GIFT',
  PAY = 'PAY',
  CONFIRM = 'CONFIRM',
}

interface CheckoutModalProps {
  onClose: () => void;
  isOpen: boolean;
  plan: PublicPlan;
}

export function CheckoutModal({ onClose, plan, isOpen }: CheckoutModalProps) {
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
      <ModalContent onClose={onClose} plan={plan} />
    </ActionModal>
  );
}

interface ModalContentProps {
  onClose: () => void;
  plan: PublicPlan;
}

function ModalContent({ onClose, plan }: ModalContentProps) {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.MODE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [checkoutData, setCheckoutData] = useState<CheckoutFormValues>({
    ...defaultCheckoutFormValues,
    start_date: new Date(),
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    ...DefaultPaymentData,
    finalPrice: plan.price,
    amountToCharge: plan.price,
  });

  const isWalletCovered = paymentData.amountToCharge === 0 && paymentData.walletAmountApplied > 0;
  const isGiftCheckout = checkoutData.is_gift;
  const planSubtitle = t('subscriptions:checkoutPlanSubtitle', {
    name: plan.name,
    validity: t('subscriptions:validForDays', { count: plan.validity_days }),
  });

  const applyPaymentPreview = useCallback((nextPaymentData: PaymentData) => {
    setPaymentData(nextPaymentData);

    const fullyCovered = nextPaymentData.amountToCharge === 0 && nextPaymentData.walletAmountApplied > 0;

    if (fullyCovered) {
      setPaymentMethod(PaymentMethod.WALLET);

      return;
    }

    setPaymentMethod(current => (current === PaymentMethod.WALLET ? null : current));
  }, []);

  const handleModeSubmit = useCallback(
    async (data: CheckoutFormValues, nextPaymentData: PaymentData) => {
      setCheckoutData(data);
      applyPaymentPreview(nextPaymentData);

      if (data.is_gift) {
        addSentryBreadcrumb('checkout.step', 'Moved to gift details step', { plan_id: plan.id });
        setStep(CheckoutStep.GIFT);

        return;
      }

      addSentryBreadcrumb('checkout.step', 'Moved to pay step', { plan_id: plan.id });
      setStep(CheckoutStep.PAY);
    },
    [applyPaymentPreview, plan.id],
  );

  const handleGiftSubmit = useCallback(
    async (data: CheckoutFormValues) => {
      setCheckoutData(data);
      addSentryBreadcrumb('checkout.step', 'Moved to pay step', { plan_id: plan.id });
      setStep(CheckoutStep.PAY);
    },
    [plan.id],
  );

  const handlePaySubmit = useCallback(() => {
    addSentryBreadcrumb('checkout.step', 'Moved to confirm step', {
      plan_id: plan.id,
      payment_method: paymentMethod ?? (isWalletCovered ? PaymentMethod.WALLET : undefined),
    });
    setStep(CheckoutStep.CONFIRM);
  }, [isWalletCovered, paymentMethod, plan.id]);

  const payBackStep = isGiftCheckout ? CheckoutStep.GIFT : CheckoutStep.MODE;

  const steps = [
    {
      title: t('subscriptions:purchaseTypeLabel'),
      subtitle: planSubtitle,
      step: CheckoutStep.MODE,
      Icon: LuList,
      form: (
        <section className='grid h-full grid-rows-[1fr] items-start'>
          <CheckoutPurchaseModeForm
            plan={plan}
            onCancel={onClose}
            onSubmit={handleModeSubmit}
            defaultFormValues={checkoutData}
          />
        </section>
      ),
    },
    ...(isGiftCheckout
      ? [
          {
            title: t('gifts:checkoutGiftStepTitle'),
            subtitle: '',
            step: CheckoutStep.GIFT,
            Icon: LuGift,
            form: (
              <CheckoutGiftDetailsForm
                defaultFormValues={checkoutData}
                onBack={() => setStep(CheckoutStep.MODE)}
                onSubmit={handleGiftSubmit}
              />
            ),
          },
        ]
      : []),
    {
      title: t('payments:selectMethod'),
      subtitle: '',
      step: CheckoutStep.PAY,
      Icon: LuCreditCard,
      form: (
        <CheckoutPayForm
          plan={plan}
          checkoutData={checkoutData}
          paymentData={paymentData}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          isWalletCovered={isWalletCovered}
          onBack={() => setStep(payBackStep)}
          onSubmit={handlePaySubmit}
        />
      ),
    },
    {
      title: t('payments:confirmationTitle'),
      subtitle: '',
      step: CheckoutStep.CONFIRM,
      Icon: LuReceipt,
      form: (
        <CheckoutPaymentProofForm
          plan={plan}
          checkoutData={checkoutData}
          paymentMethod={paymentMethod ?? (isWalletCovered ? PaymentMethod.WALLET : PaymentMethod.CARD)}
          finalPrice={paymentData.finalPrice}
          amountToCharge={paymentData.amountToCharge}
          walletAmountApplied={paymentData.walletAmountApplied}
          onClose={onClose}
          onBack={() => setStep(CheckoutStep.PAY)}
          onSubmit={(intentId: string) => {
            navigate(`${PageURLS.paymentsResult}?intentId=${intentId}`);
          }}
        />
      ),
    },
  ];

  return (
    <section
      className='m-auto h-auto max-w-[100dvw] w-dvw overflow-x-clip border-0 bg-transparent p-0 shadow-none sm:w-[96dvw] sm:max-w-[96dvw] xl:max-w-7xl'
      data-sentry-mask
    >
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
