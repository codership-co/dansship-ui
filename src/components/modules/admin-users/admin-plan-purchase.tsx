import { FormEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { AdminPaymentPricingBreakdown } from '@components/modules/admin-payments/admin-payment-pricing-breakdown';
import { TransferPaymentInstructions } from '@components/modules/payments/transfer-payment-instructions';
import { Button, Input, Label } from '@components/ui';
import { DansshipAPI, PaymentMethod, PaymentStatus } from '@core/api';
import { PageURLS } from '@core/constants';
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
  const [proof, setProof] = useState<File | null>(null);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const confirmPurchase = async () => {
    if (!planId || !proof || !preview?.is_valid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const draft = await DansshipAPI.usersAdmin.createPlanPurchase(userId, {
        ...payload,
        idempotency_key: idempotencyKey,
      });

      if (!draft.ok || !draft.data) {
        toast.error(t('admin:users.registration.purchaseFailed'));

        return;
      }

      await DansshipAPI.paymentsAdmin.uploadAdminProof(draft.data.id, proof);
      const confirmed = await DansshipAPI.usersAdmin.confirmPlanPurchase(userId, draft.data.id);

      if (!confirmed.ok || !confirmed.data?.subscription_id) {
        toast.error(t('admin:users.registration.purchaseFailed'));

        return;
      }

      setSubscriptionId(confirmed.data.subscription_id);
      toast.success(t('admin:users.registration.purchaseDone'));
    } catch {
      toast.error(t('admin:users.registration.purchaseFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (subscriptionId) {
    return (
      <section className='grid max-w-xl gap-4'>
        <p>{t('admin:users.registration.purchaseDone')}</p>
        <Button asChild className='w-fit'>
          <Link to={PageURLS.admin.userDetails(userId)}>{t('admin:users.registration.backToUser')}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className='grid max-w-3xl gap-6'>
      <form className='grid gap-4' onSubmit={event => void calculate(event)}>
        <div className='grid gap-2'>
          <Label htmlFor='plan-purchase-plan'>{t('admin:users.registration.plan')}</Label>
          <select
            id='plan-purchase-plan'
            className='h-9 rounded-md border px-3'
            required
            value={planId}
            onChange={event => {
              setPlanId(event.target.value);
              setPreview(null);
            }}
          >
            <option value='' />
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
        <label className='flex items-center gap-2 text-sm'>
          <input
            type='checkbox'
            checked={isQuarterly}
            onChange={event => {
              setIsQuarterly(event.target.checked);
              setPreview(null);
            }}
          />
          {t('admin:users.registration.quarterly')}
        </label>
        <div className='grid gap-2 sm:grid-cols-2'>
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
        <Button type='submit' className='w-fit' disabled={!planId}>
          {t('admin:users.registration.preview')}
        </Button>
      </form>

      {preview && !preview.is_valid ? <p className='text-sm text-alert-600'>{preview.rejection_reason}</p> : null}

      {preview?.is_valid ? (
        <div className='grid gap-4'>
          <AdminPaymentPricingBreakdown intent={previewIntent(userId, planId, preview)} />
          <TransferPaymentInstructions />
          <div className='grid gap-2'>
            <Label htmlFor='plan-purchase-proof'>{t('admin:users.registration.proof')}</Label>
            <Input
              id='plan-purchase-proof'
              type='file'
              accept='image/jpeg,image/png,image/webp'
              onChange={event => setProof(event.target.files?.[0] ?? null)}
            />
          </div>
          <Button
            type='button'
            className='w-fit'
            disabled={!proof || isSubmitting}
            onClick={() => void confirmPurchase()}
          >
            {t('admin:users.registration.confirmPurchase')}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
