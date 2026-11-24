import { useCallback } from 'react';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { DansshipAPI, type ParticipantTermsVersion } from '@core/api';

const EMPTY_VERSIONS: Array<ParticipantTermsVersion> = [];

/**
 * Terms of an event: one versioned PDF for every participant type. The current version is the newest;
 * a version without file means "no terms from now on" (no checkbox is asked).
 */
export const useEventTerms = (eventId: string | null) => {
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.participationAdmin.listEventTerms(eventId ?? ''),
    Boolean(eventId),
    [eventId],
  );
  const versions = response?.ok ? response.data : EMPTY_VERSIONS;
  const current = versions[0] ?? null;
  const { call: savePromise, isLoading: isSaving } = useCallablePromise(
    async (id: string, title: string, file: File | null) => {
      // The PDF goes straight to the bucket first; saving only sends its key.
      const fileKey = file ? await DansshipAPI.participationAdmin.uploadEventTermsPdf(id, file) : null;

      return DansshipAPI.participationAdmin.saveEventTerms(id, { title, file_key: fileKey });
    },
  );

  const saveTerms = useCallback(
    async (title: string, file: File | null) => {
      if (!eventId) {
        return { ok: false as const, error: null };
      }

      const result = await savePromise(eventId, title, file).then(
        value => ({ ok: value.ok, error: value.ok ? null : value.error }),
        (uploadError: unknown) => ({ ok: false, error: uploadError }),
      );

      if (result.ok) reFetch();

      return result;
    },
    [eventId, reFetch, savePromise],
  );

  return {
    versions,
    current,
    /** True when the event asks the terms checkbox (its current version has a PDF). */
    hasTerms: Boolean(current?.file_url),
    isLoading,
    isSaving,
    saveTerms,
  };
};
