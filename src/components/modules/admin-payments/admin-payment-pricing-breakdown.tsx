import { useTranslation } from 'react-i18next';

import { Badge } from '@components/ui';
import { formatPrice } from '@helpers';

import type { PaymentIntent, PaymentIntentDetail } from '@core/api';

interface AdminPaymentPricingBreakdownProps {
  intent: PaymentIntent | PaymentIntentDetail;
}

function parseMetadataNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

export function AdminPaymentPricingBreakdown({ intent }: AdminPaymentPricingBreakdownProps) {
  const { t } = useTranslation();
  const currency = intent.currency;
  const metadata = intent.metadata ?? {};
  const detail = intent as PaymentIntentDetail;

  const originalPrice = parseMetadataNumber(metadata.original_price);
  const finalPrice =
    parseMetadataNumber(metadata.final_price) ??
    (intent.wallet_amount_applied && intent.wallet_amount_applied > 0
      ? intent.amount + intent.wallet_amount_applied
      : null);
  const walletApplied = intent.wallet_amount_applied ?? 0;
  const discountAmount =
    originalPrice !== null && finalPrice !== null && originalPrice > finalPrice ? originalPrice - finalPrice : null;
  const discountCode =
    detail.discount_code ?? (typeof metadata.discount_code === 'string' ? metadata.discount_code : null);
  const referralCode =
    detail.referral_code ?? (typeof metadata.referral_code === 'string' ? metadata.referral_code : null);

  const taxLabel =
    intent.tax_rate_percentage_snapshot !== null && intent.tax_rate_percentage_snapshot !== undefined
      ? `${intent.tax_type_name_snapshot ?? t('payments:iva')} (${intent.tax_rate_percentage_snapshot}%)`
      : (intent.tax_type_name_snapshot ?? t('payments:iva'));

  return (
    <div className='space-y-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700'>
      <p className='font-semibold text-gray-900'>{t('payments:admin.pricingBreakdown.title')}</p>

      <div className='space-y-1.5'>
        {originalPrice !== null ? (
          <div className='flex items-center justify-between gap-3'>
            <span>{t('payments:admin.pricingBreakdown.originalPrice')}</span>
            <span>{formatPrice(originalPrice, currency)}</span>
          </div>
        ) : null}

        {discountAmount !== null && discountAmount > 0 ? (
          <div className='flex items-center justify-between gap-3 text-emerald-700'>
            <span>{t('payments:discount')}</span>
            <span>-{formatPrice(discountAmount, currency)}</span>
          </div>
        ) : null}

        {(discountCode || referralCode) && (
          <div className='flex flex-wrap gap-2 pt-0.5'>
            {discountCode ? (
              <Badge variant='outlineTertiary' size='small'>
                {t('payments:discount')}: {discountCode}
              </Badge>
            ) : null}
            {referralCode ? (
              <Badge variant='outlineTertiary' size='small'>
                {t('payments:admin.pricingBreakdown.referralCode')}: {referralCode}
              </Badge>
            ) : null}
          </div>
        )}

        {intent.base_amount !== null && intent.base_amount !== undefined ? (
          <div className='flex items-center justify-between gap-3'>
            <span>{t('payments:subtotal')}</span>
            <span>{formatPrice(intent.base_amount, currency)}</span>
          </div>
        ) : null}

        {intent.tax_amount !== null && intent.tax_amount !== undefined ? (
          <div className='flex items-center justify-between gap-3'>
            <span>{taxLabel}</span>
            <span>{formatPrice(intent.tax_amount, currency)}</span>
          </div>
        ) : null}

        {finalPrice !== null ? (
          <div className='flex items-center justify-between gap-3 border-t border-gray-100 pt-1.5 font-medium text-gray-900'>
            <span>{t('payments:admin.pricingBreakdown.purchaseTotal')}</span>
            <span>{formatPrice(finalPrice, currency)}</span>
          </div>
        ) : null}

        {walletApplied > 0 ? (
          <div className='flex items-center justify-between gap-3 text-emerald-700'>
            <span>{t('payments:admin.pricingBreakdown.walletApplied')}</span>
            <span>-{formatPrice(walletApplied, currency)}</span>
          </div>
        ) : null}

        <div className='flex items-center justify-between gap-3 border-t border-gray-200 pt-1.5 font-semibold text-gray-900'>
          <span>{t('payments:admin.pricingBreakdown.amountToPay')}</span>
          <span>{formatPrice(intent.amount, currency)}</span>
        </div>
      </div>
    </div>
  );
}
