import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft, LuArrowRight, LuCreditCard, LuList, LuReceipt } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { PaymentMethodSelector } from './payment-method-selector';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import {
  CheckoutFormValues,
  CheckoutReviewPlanFormInput,
  DefaultDiscountData,
  DiscountData,
} from '@components/forms/checkout-review-plan-form';
import { FormStepperLayout } from '@components/layouts';
import { PlanCard } from '@components/modules';
import { Button, Dialog, DialogContent } from '@components/ui';
import { PaymentMethod, type PublicPlan } from '@core/api';
import { PageURLS } from '@core/constants';
import { cn } from '@helpers';

export enum CheckoutStep {
  REVIEW = 'REVIEW',
  METHOD = 'METHOD',
  CONFIRM = 'CONFIRM',
}

interface CheckoutModalProps {
  onClose: () => void;
  plan: PublicPlan | null;
}

export function CheckoutModal({ onClose, plan }: CheckoutModalProps) {
  return (
    <Dialog open={plan !== null} onOpenChange={open => !open && onClose()}>
      {plan && <ModalContent onClose={onClose} plan={plan} />}
    </Dialog>
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
  const [discountData, setDiscountData] = useState<DiscountData>({
    ...DefaultDiscountData,
    finalPrice: plan.price,
  });

  const handleSubmit = useCallback(async (data: CheckoutFormValues, discountData: DiscountData) => {
    setCheckoutData(data);
    setDiscountData(discountData);
    setStep(CheckoutStep.METHOD);
  }, []);

  return (
    <DialogContent
      className='bg-transparent shadow-none border-0 p-0 max-w-none w-auto h-auto m-auto'
      onInteractOutside={event => event.preventDefault()}
    >
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
                    className='flex items-center'
                    variant='outline'
                    onClick={() => setStep(CheckoutStep.REVIEW)}
                  >
                    <LuArrowLeft />
                    {t('common:back')}
                  </Button>

                  <Button
                    type='button'
                    className='flex items-center'
                    disabled={!paymentMethod}
                    onClick={() => setStep(CheckoutStep.CONFIRM)}
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
                finalPrice={discountData.finalPrice}
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
        noAvailableStepMessage={':D'}
      />
    </DialogContent>
  );
}
