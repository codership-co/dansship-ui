import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { CreateRoomPayload, DansshipAPI, UpdateRoomPayload } from '@core/api';

export const useRooms = () => {
  const { t } = useTranslation();

  const { response: rooms, isLoading } = usePromise(() => DansshipAPI.inventoryAdmin.getRooms());
  const { call: createRoomPromise, isLoading: isCreatingRoom } = useCallablePromise((payload: CreateRoomPayload) =>
    DansshipAPI.inventoryAdmin.createRoom(payload),
  );
  const { call: updateRoomPromise, isLoading: isUpdatingRoom } = useCallablePromise(
    (id: string, payload: UpdateRoomPayload) => DansshipAPI.inventoryAdmin.updateRoom(id, payload),
  );
  const { call: deleteRoomPromise, isLoading: isDeletingRoom } = useCallablePromise((id: string) =>
    DansshipAPI.inventoryAdmin.deleteRoom(id),
  );
  const { call: reactivateRoomPromise, isLoading: isReactivatingRoom } = useCallablePromise((id: string) =>
    DansshipAPI.inventoryAdmin.reactivateRoom(id),
  );

  const createRoom = useCallback(
    async (payload: CreateRoomPayload) => {
      const { ok } = await createRoomPromise(payload);

      if (ok) {
        toast.success(t('inventory:rooms.createSuccess'));
      } else {
        toast.error(t('inventory:rooms.createFailed'));
      }
    },
    [t, createRoomPromise],
  );

  const updateRoom = useCallback(
    async (id: string, payload: UpdateRoomPayload) => {
      const { ok } = await updateRoomPromise(id, payload);

      if (ok) {
        toast.success(t('inventory:rooms.updateSuccess'));
      } else {
        toast.error(t('inventory:rooms.updateFailed'));
      }
    },
    [t, updateRoomPromise],
  );

  const deleteRoom = useCallback(
    async (id: string) => {
      const { ok } = await deleteRoomPromise(id);

      if (ok) {
        toast.success(t('inventory:rooms.deactivateSuccess'));
      } else {
        toast.error(t('inventory:rooms.deactivateFailed'));
      }
    },
    [t, deleteRoomPromise],
  );

  const reactivateRoom = useCallback(
    async (id: string) => {
      const { ok } = await reactivateRoomPromise(id);

      if (ok) {
        toast.success(t('inventory:rooms.reactivateSuccess'));
      } else {
        toast.error(t('inventory:rooms.reactivateFailed'));
      }
    },
    [t, reactivateRoomPromise],
  );

  return {
    rooms: rooms?.data ?? [],
    isLoading,
    createRoom,
    updateRoom,
    deleteRoom,
    reactivateRoom,
    isCreating: isCreatingRoom,
    isUpdating: isUpdatingRoom,
    isDeleting: isDeletingRoom,
    isReactivating: isReactivatingRoom,
  };
};
