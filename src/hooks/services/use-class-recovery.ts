import { useMemo } from 'react';

import { RESUME_REVALIDATE, usePromise } from '../use-promise';

import { DansshipAPI } from '@core/api';

/** Lost and unused credits the student can pay to recover (ADR-056). */
export const useRecoverableClasses = () => {
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.classRecovery.getRecoverable(),
    true,
    [],
    RESUME_REVALIDATE,
  );

  const subscriptions = useMemo(() => response?.data?.subscriptions ?? [], [response?.data?.subscriptions]);

  return {
    subscriptions,
    settings: response?.data?.settings ?? null,
    isLoading,
    hasError: Boolean(response && !response.ok),
    reload: reFetch,
  };
};

export const useClassRecoverySettings = (enabled = true) => {
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.classRecoveryAdmin.getSettings(), enabled);

  return { settings: response?.data ?? null, isLoading, reload: reFetch };
};

export const useUserClassRecoveries = (userId: string | undefined) => {
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.classRecoveryAdmin.getUserRecoveries(userId ?? ''),
    Boolean(userId),
    [userId],
  );

  return { data: response?.data ?? null, isLoading, reload: reFetch };
};

export const useClassRecoveryReview = (paymentIntentId: string | undefined, enabled: boolean) => {
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.classRecoveryAdmin.getPaymentReview(paymentIntentId ?? ''),
    enabled && Boolean(paymentIntentId),
    [paymentIntentId],
  );

  return { review: response?.data ?? null, isLoading, reload: reFetch };
};
