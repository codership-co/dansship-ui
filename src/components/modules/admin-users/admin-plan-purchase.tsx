import { Button } from 'polpo/components';
import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { AdminPaymentPricingBreakdown } from '@components/modules/admin-payments/admin-payment-pricing-breakdown';
import { CollapsibleTotal } from '@components/modules/payments/collapsible-total';
import { Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { DansshipAPI, PaymentMethod, PaymentStatus } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatPrice } from '@helpers';
import { usePromise } from '@hooks';

import type { PaymentIntent } from '@core/api/payments/payments.models';
import type { InPersonPlanPreview } from '@core/api/users/users.models';

interface AdminPlanPurchaseProps {
  userId: string;
}

function asNumber(value: string | number) {
  return typeof value === 'number' ? value : Number(value);
}

function previewIntent(userId: string, planId: string, preview: InPersonPlanPreview): PaymentIntent {
  return {
    id: 'preview',
    user_id: userId,
    amount: asNumber(preview.amount_to_charge),
    wallet_amount_applied: asNumber(preview.wallet_amount_applied),
    currency: 'COP',
    purchase_type: 'plan',
    reference_id: planId,
    payment_method_type: PaymentMethod.TRANSFER,
    status: PaymentStatus.PENDING_MANUAL_REVIEW,
    gateway_provider: null,
    gateway_reference: null,
    proof_url: null,
    subscription_id: null,
    tax_type_name_snapshot: preview.tax_type_name,
    tax_rate_percentage_snapshot: asNumber(preview.tax_rate_percentage),
    tax_amount: asNumber(preview.tax_amount),
    base_amount: asNumber(preview.base_amount),
    metadata: {
      original_price: asNumber(preview.original_price),
      final_price: asNumber(preview.final_price),
    },
    admin_notes: null,
    reviewed_by: null,
    reviewed_at: null,
    expires_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function AdminPlanPurchase({ userId }: AdminPlanPurchaseProps) {
  const { t } = useTranslation();
  const { response: plansResponse } = usePromise(() => DansshipAPI.billingAdmin.getPlans({ is_active: true }));
  const plans = useMemo(() => (plansResponse?.data ?? []).filter(plan => plan.is_active), [plansResponse?.data]);
  const [planId, setPlanId] = useState('');
  const [isQuarterly, setIsQuarterly] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [preview, setPreview] = useState<InPersonPlanPreview | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  const payload = {
    plan_id: planId,
    payment_method_type: 'transfer' as const,
    discount_code: discountCode.trim() || null,
    referral_code: referralCode.trim() || null,
    is_quarterly: isQuarterly,
  };

  const calculate = async (event: FormEvent) => {
    event.preventDefault();
    setPreview(null);
    const response = await DansshipAPI.usersAdmin.previewPlanPurchase(userId, payload);

    if (!response.ok || !response.data) {
      toast.error(t('admin:users.registration.previewFailed'));

      return;
    }

    setPreview(response.data);
  };

  const createDraft = async () => {
    const draft = await DansshipAPI.usersAdmin.createPlanPurchase(userId, {
      ...payload,
      idempotency_key: idempotencyKey,
    });

    if (!draft.ok || !draft.data) {
      toast.error(t('admin:users.registration.purchaseFailed'));

      return null;
    }

    return draft.data.id;
  };

  const confirmPurchase = async (intentId: string) => {
    const confirmed = await DansshipAPI.usersAdmin.confirmPlanPurchase(userId, intentId);

    if (!confirmed.ok || !confirmed.data?.subscription_id) {
      toast.error(t('admin:users.registration.purchaseFailed'));

      return;
    }

    setSubscriptionId(confirmed.data.subscription_id);
    toast.success(t('admin:users.registration.purchaseDone'));
  };

  if (subscriptionId) {
    return (
      <section className='grid max-w-xl gap-4'>
        <p>{t('admin:users.registration.purchaseDone')}</p>
        <Link to={PageURLS.admin.userDetails(userId)}>
          <Button color='primary' variant='solid'>
            {t('admin:users.registration.backToUser')}
          </Button>
        </Link>
      </section>
    );
  }

  if (preview?.is_valid) {
    const amountToCharge = asNumber(preview.amount_to_charge);
    const walletAmountApplied = asNumber(preview.wallet_amount_applied);
    const hasDiscount = asNumber(preview.original_price) > asNumber(preview.final_price);

    return (
      <div className='flex flex-col'>
        <CheckoutPaymentProofForm
          variant='event'
          allowPdfProof
          hideSummary
          paymentMethod={PaymentMethod.TRANSFER}
          finalPrice={asNumber(preview.final_price)}
          amountToCharge={amountToCharge}
          walletAmountApplied={walletAmountApplied}
          confirmLabel={t('eventos:checkout.confirmPay')}
          topSlot={
            <div className='grid gap-4'>
              <CollapsibleTotal
                subtitle={t('eventos:checkout.vatIncluded', {
                  amount: formatPrice(asNumber(preview.tax_amount), 'COP'),
                })}
                amount={amountToCharge}
                baseAmount={asNumber(preview.base_amount)}
                taxAmount={asNumber(preview.tax_amount)}
                walletAmountApplied={walletAmountApplied}
              />
              {hasDiscount ? <AdminPaymentPricingBreakdown intent={previewIntent(userId, planId, preview)} /> : null}
            </div>
          }
          onClose={() => undefined}
          onBack={() => setPreview(null)}
          onCreateIntent={createDraft}
          uploadProofForIntent={(intentId, file) => DansshipAPI.paymentsAdmin.uploadAdminProof(intentId, file)}
          onSubmit={intentId => void confirmPurchase(intentId)}
        />
      </div>
    );
  }

  const resetPreview = () => setPreview(null);

  return (
    <section className='grid max-w-3xl gap-6'>
      <form className='grid gap-4' onSubmit={event => void calculate(event)}>
        <div className='grid gap-2'>
          <Label htmlFor='plan-purchase-plan'>{t('admin:users.registration.plan')}</Label>
          <Select
            value={planId}
            onValueChange={value => {
              setPlanId(value);
              resetPreview();
            }}
          >
            <SelectTrigger id='plan-purchase-plan'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='flex items-center gap-2'>
          <Checkbox
            id='plan-purchase-quarterly'
            checked={isQuarterly}
            onCheckedChange={value => {
              setIsQuarterly(value === true);
              resetPreview();
            }}
          />
          <Label htmlFor='plan-purchase-quarterly' className='m-0 font-normal'>
            {t('admin:users.registration.quarterly')}
          </Label>
        </div>
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='grid gap-2'>
            <Label htmlFor='plan-purchase-discount'>{t('admin:users.registration.discountCode')}</Label>
            <Input
              id='plan-purchase-discount'
              value={discountCode}
              onChange={event => setDiscountCode(event.target.value)}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='plan-purchase-referral'>{t('admin:users.registration.referralCode')}</Label>
            <Input
              id='plan-purchase-referral'
              value={referralCode}
              onChange={event => setReferralCode(event.target.value)}
            />
          </div>
        </div>
        {preview && !preview.is_valid ? <p className='text-sm text-alert-600'>{preview.rejection_reason}</p> : null}
        <div className='flex justify-end'>
          <Button color='primary' variant='solid' type='submit' disabled={!planId}>
            {t('admin:users.registration.preview')}
          </Button>
        </div>
      </form>
    </section>
  );
}
