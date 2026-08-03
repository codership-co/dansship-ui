import { ActionModal, Button } from 'polpo/components';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuArrowRight, LuCreditCard, LuList, LuReceipt } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { PaymentMethodSelector } from './payment-method-selector';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import {
  CheckoutFormValues,
  CheckoutReviewPlanFormInput,
  DefaultPaymentData,
  PaymentData,
} from '@components/forms/checkout-review-plan-form';
import { FormStepperLayout } from '@components/layouts';
import { PlanCard } from '@components/modules';
import { PaymentMethod, type PublicPlan } from '@core/api';
import { PageURLS } from '@core/constants';
import { addSentryBreadcrumb } from '@core/sentry';
import { cn } from '@helpers';

export enum CheckoutStep {
  REVIEW = 'REVIEW',
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
      className='p-0 rounded-none sm:rounded-xl'
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
    start_date: new Date(),
    discount_code: '',
  });
  const [paymentData, setPaymentData] = useState<PaymentData>({
    ...DefaultPaymentData,
    finalPrice: plan.price,
  });

  const handleSubmit = useCallback(
    async (data: CheckoutFormValues, nextPaymentData: PaymentData) => {
      setCheckoutData(data);
      setPaymentData(nextPaymentData);
      addSentryBreadcrumb('checkout.step', 'Moved to payment method step', { plan_id: plan.id });
      setStep(CheckoutStep.METHOD);
    },
    [plan.id],
  );

  return (
    <section className='bg-transparent shadow-none border-0 p-0 max-w-none w-auto h-auto m-auto' data-sentry-mask>
      <FormStepperLayout
        className={cn(
          'm-auto overflow-auto rounded-none sm:rounded-xl',
          'w-dvw max-w-dvw overflow-y-auto',
          'h-dvh md:h-[80dvh]',
          'max-h-dvh sm:max-h-[96dvh]',
          'max-w-dvw sm:max-w-[96dvw] xl:max-w-7xl',
        )}
        steps={[
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
                  onSubmit={handleSubmit}
                  defaultFormValues={checkoutData}
                />
              </section>
            ),
          },
          {
            title: t('payments:selectMethod'),
            subtitle: '',
            step: CheckoutStep.METHOD,
            Icon: LuCreditCard,
            form: (
              <section className='grid grid-rows-[1fr_auto] h-full'>
                <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

                <div className='flex justify-end gap-2 pt-4'>
                  <Button
                    type='button'
                    color='primary'
                    className='flex items-center'
                    variant='outlined'
                    onClick={() => setStep(CheckoutStep.REVIEW)}
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
          {
            title: t('payments:confirmationTitle'),
            subtitle: '',
            step: CheckoutStep.CONFIRM,
            Icon: LuReceipt,
            form: (
              <CheckoutPaymentProofForm
                plan={plan}
                checkoutData={checkoutData}
                paymentMethod={paymentMethod ?? PaymentMethod.CARD}
                finalPrice={paymentData.finalPrice}
                onClose={onClose}
                onBack={() => setStep(CheckoutStep.METHOD)}
                onSubmit={(intentId: string) => {
                  navigate(`${PageURLS.paymentsResult}?intentId=${intentId}`);
                }}
              />
            ),
          },
        ]}
        currentStep={step}
      />
    </section>
  );
}
