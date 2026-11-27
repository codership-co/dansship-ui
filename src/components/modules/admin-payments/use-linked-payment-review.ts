import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { DansshipAPI, type PaymentIntent } from '@core/api';
import { ADMIN_PAYMENT_QUERY_PARAM } from '@core/constants';

/**
 * Opens the review of the payment named in the URL (`?payment=<id>`), the link
 * the "Pago por revisar" manager email sends. Clearing the param on close keeps
 * a reload from reopening it.
 */
export function useLinkedPaymentReview(onOpen: (intent: PaymentIntent) => void, enabled = true) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedId = enabled ? searchParams.get(ADMIN_PAYMENT_QUERY_PARAM) : null;

  const clearLinkedPayment = useCallback(() => {
    if (!searchParams.has(ADMIN_PAYMENT_QUERY_PARAM)) {
      return;
    }

    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous);
        next.delete(ADMIN_PAYMENT_QUERY_PARAM);

        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!linkedId) {
      return;
    }

    let cancelled = false;

    void DansshipAPI.paymentsAdmin.getAdminPaymentDetail(linkedId).then(({ ok, data }) => {
      if (cancelled) {
        return;
      }

      if (ok && data) {
        onOpen(data);
      } else {
        toast.error(t('payments:admin.linkedPaymentNotFound'));
        clearLinkedPayment();
      }
    });

    return () => {
      cancelled = true;
    };
    // Fetch once per linked id; onOpen and clearLinkedPayment change identity on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedId]);

  return { clearLinkedPayment };
}
