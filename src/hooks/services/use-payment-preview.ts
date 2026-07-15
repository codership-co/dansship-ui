import { useCallback, useEffect, useState } from 'react';

import { useCallablePromise } from '../use-callable-promise';

import { DansshipAPI, PaymentPreviewMappedResponse, PaymentPreviewRequest } from '@core/api';

export interface CheckoutPaymentPreview {
  baseAmount: number;
  taxAmount: number;
  taxTypeName: string;
  taxRatePercentage: number;
  finalPrice: number;
  originalPrice: number;
  discountApplied: boolean;
  discountType: 'percentage' | 'fixed_amount' | null;
  discountValue: number;
  isValid: boolean;
  rejectionReason: string | null;
  discountCode: string;
}

const mapPreviewResponse = (data: PaymentPreviewMappedResponse, discountCode: string): CheckoutPaymentPreview => ({
  baseAmount: data.base_amount,
  taxAmount: data.tax_amount,
  taxTypeName: data.tax_type_name,
  taxRatePercentage: data.tax_rate_percentage,
  finalPrice: data.final_price,
  originalPrice: data.original_price,
  discountApplied: data.discount_applied,
  discountType: data.discount_type,
  discountValue: data.discount_value,
  isValid: data.is_valid,
  rejectionReason: data.rejection_reason,
  discountCode: discountCode.trim().toUpperCase(),
});

export const usePaymentPreview = (planId: string, discountCode: string, enabled: boolean) => {
  const [preview, setPreview] = useState<CheckoutPaymentPreview | null>(null);
  const { call: previewPayment, isLoading } = useCallablePromise((payload: PaymentPreviewRequest) =>
    DansshipAPI.payments.previewPayment(payload),
  );

  const fetchPreview = useCallback(async () => {
    if (!enabled) {
      return;
    }

    const normalizedCode = discountCode.trim();
    const { data, ok } = await previewPayment({
      plan_id: planId,
      discount_code: normalizedCode ? normalizedCode.toUpperCase() : undefined,
    });

    if (ok) {
      setPreview(mapPreviewResponse(data, normalizedCode));
    } else {
      setPreview(null);
    }
  }, [discountCode, enabled, planId, previewPayment]);

  useEffect(() => {
    if (!enabled) {
      setPreview(null);

      return;
    }

    void fetchPreview();
  }, [enabled, fetchPreview]);

  return {
    preview,
    isLoading,
    refetch: fetchPreview,
  };
};
