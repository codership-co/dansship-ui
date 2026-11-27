import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';

import { DansshipAPI, type PaymentIntent } from '@core/api';
import { ADMIN_PAYMENT_QUERY_PARAM } from '@core/constants';

const PAYMENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND_STATUS = 404;

/**
 * Opens the review of the payment named in the URL (`?payment=<id>`), the link
 * the "Pago por revisar" manager email sends.
 *
 * Only a UUID reaches the API. A payment that does not exist warns and drops
 * the param; any other failure warns but keeps it, so a reload can retry.
 * Closing the review drops the param so a reload does not reopen it.
 */
export function useLinkedPaymentReview(onOpen: (intent: PaymentIntent) => void, enabled = true) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedId = enabled ? searchParams.get(ADMIN_PAYMENT_QUERY_PARAM) : null;
  const { call: fetchDetail } = useCallablePromise((id: string) => DansshipAPI.paymentsAdmin.getAdminPaymentDetail(id));

  const clearLinkedPayment = useCallback(() => {
    setSearchParams(
      previous => {
        if (!previous.has(ADMIN_PAYMENT_QUERY_PARAM)) {
          return previous;
        }

        const next = new URLSearchParams(previous);

        next.delete(ADMIN_PAYMENT_QUERY_PARAM);

        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  useEffect(() => {
    if (!linkedId) {
      return;
    }

    if (!PAYMENT_ID_PATTERN.test(linkedId)) {
      toast.error(t('payments:admin.linkedPaymentNotFound'));
      clearLinkedPayment();

      return;
    }

    let cancelled = false;

    void fetchDetail(linkedId).then(response => {
      if (cancelled) {
        return;
      }

      if (response.ok && response.data) {
        onOpen(response.data);
      } else if (response.status === NOT_FOUND_STATUS) {
        toast.error(t('payments:admin.linkedPaymentNotFound'));
        clearLinkedPayment();
      } else {
        toast.error(t('payments:admin.linkedPaymentLoadFailed'));
      }
    });

    return () => {
      cancelled = true;
    };
    // One fetch per linked id; onOpen is a fresh closure on every render of the caller.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedId]);

  return { clearLinkedPayment };
}
