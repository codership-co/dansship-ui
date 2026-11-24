import { useCallback, useMemo } from 'react';

import { usePromise } from '../use-promise';

import { DansshipAPI, type EventTypeLabel, type EventTypeLabelUpdatePayload } from '@core/api';

const EMPTY_LABELS: Array<EventTypeLabel> = [];

/** "Editar lista": the event labels. A label carries no behavior and is never deleted, only stops being offered. */
export const useEventTypeLabels = () => {
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.eventosAdmin.listTypeLabels());
  const labels = response?.ok ? response.data : EMPTY_LABELS;
  const offered = useMemo(() => labels.filter(label => label.is_offered), [labels]);

  const createLabel = useCallback(
    async (name: string) => {
      const result = await DansshipAPI.eventosAdmin.createTypeLabel(name.trim());

      if (result.ok) reFetch();

      return result;
    },
    [reFetch],
  );

  const updateLabel = useCallback(
    async (labelId: string, payload: EventTypeLabelUpdatePayload) => {
      const result = await DansshipAPI.eventosAdmin.updateTypeLabel(labelId, payload);

      if (result.ok) reFetch();

      return result;
    },
    [reFetch],
  );

  return { labels, offered, isLoading, createLabel, updateLabel };
};
