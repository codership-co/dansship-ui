import { useCallback, useRef, useState } from 'react';

import { DansshipAPI, type AdminEnrollmentPayload, type AdminEnrollmentResult } from '@core/api';

/**
 * "+ Inscribir persona" (enroll:event). "Sí, ya pagó" uploads the proof to the admin's pending folder first;
 * one idempotency key per attempt keeps a retried request from registering two payments.
 */
export const useEventEnrollment = (eventId: string) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());

  const enroll = useCallback(
    async (payload: AdminEnrollmentPayload, proof: File | null) => {
      setIsEnrolling(true);

      try {
        let proofKey: string | null = null;

        if (payload.payment === 'paid') {
          if (!proof) {
            return { ok: false as const, error: null };
          }

          const presign = await DansshipAPI.eventosAdmin.uploadInstallmentProof(proof);

          if (!presign.ok || !presign.data.file_key) {
            return { ok: false as const, error: presign.ok ? null : (presign.error as unknown) };
          }

          proofKey = presign.data.file_key;
        }

        const result = await DansshipAPI.participationAdmin.enroll(eventId, {
          ...payload,
          ...(payload.payment === 'paid' ? { proof_key: proofKey, idempotency_key: idempotencyKeyRef.current } : {}),
        });

        if (result.ok) {
          idempotencyKeyRef.current = crypto.randomUUID();
        }

        return result.ok
          ? { ok: true as const, data: result.data as AdminEnrollmentResult }
          : { ok: false as const, error: result.error as unknown };
      } catch (uploadError) {
        return { ok: false as const, error: uploadError };
      } finally {
        setIsEnrolling(false);
      }
    },
    [eventId],
  );

  return { enroll, isEnrolling };
};
