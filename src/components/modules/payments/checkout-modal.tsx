import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCheck, LuCreditCard, LuList, LuReceipt } from 'react-icons/lu';

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
import { type PublicPlan, type PaymentMethodType } from '@core/api';

export enum CheckoutStep {
  REVIEW = 'REVIEW',
  METHOD = 'METHOD',
  CONFIRM = 'CONFIRM',
  CONFIRMATION = 'CONFIRMATION',
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

  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.REVIEW);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('transfer');
  const [createdIntentId, setCreatedIntentId] = useState<string>('');
  const requiresProof = paymentMethod === 'transfer' || paymentMethod === 'nequi' || paymentMethod === 'daviplata';
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
      className='bg-transparent border-0 h-full w-full max-w-none p-0'
      onInteractOutside={event => event.preventDefault()}
    >
      <div className='mx-auto w-full max-w-7xl p-2 sm:px-4 md:px-8 grid gap-8 my-auto max-h-screen sm:max-h-[80dvh] overflow-y-auto'>
        <FormStepperLayout
          steps={[
            {
              title: t('payments:checkoutTitle'),
              subtitle: '',
              step: CheckoutStep.REVIEW,
              Icon: LuList,
              form: (
                <section className='grid lg:grid-cols-[280px_1fr] items-start gap-8'>
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
                <section>
                  <PaymentMethodSelector
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    availableMethods={['transfer', 'cash', 'nequi', 'daviplata']}
                  />

                  <div className='flex justify-end gap-2 pt-4'>
                    <Button type='button' variant='outline' onClick={() => setStep(CheckoutStep.REVIEW)}>
                      {t('common:back')}
                    </Button>

                    <Button type='button' onClick={() => setStep(CheckoutStep.CONFIRM)}>
                      {t('common:next')}
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
                  paymentMethod={paymentMethod}
                  finalPrice={discountData.finalPrice}
                  requiresProof={requiresProof}
                  onClose={onClose}
                  onBack={() => setStep(CheckoutStep.METHOD)}
                  onSubmit={(intentId: string) => {
                    setStep(CheckoutStep.CONFIRMATION);
                    setCreatedIntentId(intentId);
                  }}
                />
              ),
            },
            {
              title: t('payments:intentCreatedTitle'),
              subtitle: t('payments:intentCreatedDesc'),
              step: CheckoutStep.CONFIRMATION,
              Icon: LuCheck,
              form: (
                <div className='space-y-3 text-center'>
                  {createdIntentId ? (
                    <p className='text-xs text-gray-500'>
                      {t('payments:reference')}: {createdIntentId}
                    </p>
                  ) : null}
                  <div className='flex justify-end gap-2 pt-4'>
                    <Button type='button' onClick={onClose}>
                      {t('common:close')}
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
          currentStep={step}
          noAvailableStepMessage={':D'}
        />
      </div>
    </DialogContent>
  );
}
