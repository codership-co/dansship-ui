import { ActionModal, Button } from 'polpo/components';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuArrowRight, LuCreditCard, LuGift, LuList, LuReceipt } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { PaymentMethodSelector } from './payment-method-selector';

import { CheckoutGiftDetailsForm } from '@components/forms/checkout-gift-details-form';
import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import {
  CheckoutFormValues,
  CheckoutReviewPlanFormInput,
  defaultCheckoutFormValues,
  DefaultPaymentData,
  PaymentData,
} from '@components/forms/checkout-review-plan-form';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { PlanCard } from '@components/modules/payments/plan-card';
import { PaymentMethod, type PublicPlan } from '@core/api';
import { PageURLS } from '@core/constants';
import { addSentryBreadcrumb } from '@core/sentry';
import { cn } from '@helpers';

export enum CheckoutStep {
  REVIEW = 'REVIEW',
  GIFT = 'GIFT',
  METHOD = 'METHOD',
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
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.REVIEW);
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

  const goAfterReviewOrGift = useCallback(
    (nextPaymentData: PaymentData) => {
      const fullyCovered = nextPaymentData.amountToCharge === 0 && nextPaymentData.walletAmountApplied > 0;

      if (fullyCovered) {
        setPaymentMethod(PaymentMethod.WALLET);
        addSentryBreadcrumb('checkout.step', 'Moved to wallet confirm step', { plan_id: plan.id });
        setStep(CheckoutStep.CONFIRM);

        return;
      }

      addSentryBreadcrumb('checkout.step', 'Moved to payment method step', { plan_id: plan.id });
      setStep(CheckoutStep.METHOD);
    },
    [plan.id],
  );

  const handleReviewSubmit = useCallback(
    async (data: CheckoutFormValues, nextPaymentData: PaymentData) => {
      setCheckoutData(data);
      setPaymentData(nextPaymentData);

      if (data.is_gift) {
        addSentryBreadcrumb('checkout.step', 'Moved to gift details step', { plan_id: plan.id });
        setStep(CheckoutStep.GIFT);

        return;
      }

      goAfterReviewOrGift(nextPaymentData);
    },
    [goAfterReviewOrGift, plan.id],
  );

  const handleGiftSubmit = useCallback(
    async (data: CheckoutFormValues) => {
      setCheckoutData(data);
      goAfterReviewOrGift(paymentData);
    },
    [goAfterReviewOrGift, paymentData],
  );

  const confirmBackStep = isWalletCovered
    ? isGiftCheckout
      ? CheckoutStep.GIFT
      : CheckoutStep.REVIEW
    : CheckoutStep.METHOD;

  const methodBackStep = isGiftCheckout ? CheckoutStep.GIFT : CheckoutStep.REVIEW;

  const steps = [
    {
      title: t('payments:checkoutTitle'),
      subtitle: '',
      step: CheckoutStep.REVIEW,
      Icon: LuList,
      form: (
        <section className='grid h-full grid-rows-[auto_1fr] items-start gap-8'>
          <PlanCard plan={plan} className='border-none' asIndividual />
          <CheckoutReviewPlanFormInput
            plan={plan}
            onCancel={onClose}
            onSubmit={handleReviewSubmit}
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
                onBack={() => setStep(CheckoutStep.REVIEW)}
                onSubmit={handleGiftSubmit}
              />
            ),
          },
        ]
      : []),
    ...(isWalletCovered
      ? []
      : [
          {
            title: t('payments:selectMethod'),
            subtitle: '',
            step: CheckoutStep.METHOD,
            Icon: LuCreditCard,
            form: (
              <section className='grid grid-rows-[1fr_auto] h-full'>
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

                <div className='flex flex-wrap justify-end gap-2 pt-4'>
                  <Button
                    type='button'
                    color='primary'
                    className='flex items-center'
                    variant='outlined'
                    onClick={() => setStep(methodBackStep)}
                  >
                    <LuArrowLeft />
                    {t('common:back')}
                  </Button>

                  <Button
                    type='button'
                    color='primary'
                    className='flex items-center'
                    disabled={!paymentMethod}
                    onClick={() => {
                      addSentryBreadcrumb('checkout.step', 'Moved to confirm step', {
                        plan_id: plan.id,
                        payment_method: paymentMethod ?? undefined,
                      });
                      setStep(CheckoutStep.CONFIRM);
                    }}
                  >
                    {t('common:next')}
                    <LuArrowRight />
                  </Button>
                </div>
              </section>
            ),
          },
        ]),
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
          onBack={() => setStep(confirmBackStep)}
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
