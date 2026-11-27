import { useCallback, useEffect, useRef, useState } from 'react';

import { usePromise } from '../use-promise';

import {
  DansshipAPI,
  draftParticipantType,
  isDraftType,
  type ParticipantTypeAdmin,
  type ParticipantTypeUpsert,
} from '@core/api';

/**
 * The participant types of an event. "+ Agregar tipo" only adds a draft in the editor; "Guardar tipo"
 * creates it in the API and then saves its configuration. Saved types replace their row.
 */
export const useParticipantTypes = (eventId: string) => {
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.participationAdmin.listTypes(eventId), true, [
    eventId,
  ]);
  const [types, setTypes] = useState<Array<ParticipantTypeAdmin>>([]);
  // A draft whose create succeeded but whose save failed: the next save updates that row instead of creating another.
  const createdIds = useRef(new Map<string, string>());

  useEffect(() => {
    if (response?.ok) setTypes(current => [...response.data, ...current.filter(isDraftType)]);
  }, [response]);

  const addDraft = useCallback(
    (name: string) => {
      const draft = draftParticipantType(eventId, name, types.length);

      setTypes(current => [...current, draft]);

      return draft;
    },
    [eventId, types.length],
  );

  const removeDraft = useCallback((typeId: string) => {
    createdIds.current.delete(typeId);
    setTypes(current => current.filter(type => type.id !== typeId));
  }, []);

  /** Deletes a saved type (draft event, no signups); the API refuses otherwise. */
  const deleteType = useCallback(
    async (typeId: string) => {
      const result = await DansshipAPI.participationAdmin.deleteType(eventId, typeId);

      if (result.ok) setTypes(current => current.filter(type => type.id !== typeId));

      return result;
    },
    [eventId],
  );

  const saveType = useCallback(
    async (typeId: string, payload: ParticipantTypeUpsert) => {
      let targetId = createdIds.current.get(typeId) ?? typeId;

      if (isDraftType({ id: targetId })) {
        const created = await DansshipAPI.participationAdmin.createType(eventId);

        if (!created.ok) return created;

        targetId = created.data.id;
        createdIds.current.set(typeId, targetId);
      }

      const result = await DansshipAPI.participationAdmin.updateType(eventId, targetId, payload);

      if (result.ok) {
        createdIds.current.delete(typeId);
        setTypes(current => current.map(type => (type.id === typeId ? result.data : type)));
      }

      return result;
    },
    [eventId],
  );

  return {
    types,
    isLoading: isLoading && types.length === 0,
    /** How many types the API returned (null until it answers): an event with none starts with a draft «General». */
    savedCount: response?.ok ? response.data.length : null,
    reFetch,
    addDraft,
    removeDraft,
    deleteType,
    saveType,
  };
};
