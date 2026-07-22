import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { CreateRoomPayload, DansshipAPI, UpdateRoomPayload } from '@core/api';

export const useRooms = () => {
  const { t } = useTranslation();

  const { response: rooms, isLoading, reFetch } = usePromise(() => DansshipAPI.inventoryAdmin.getRooms());
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
  const { call: uploadRoomImagePromise, isLoading: isUploadingRoomImage } = useCallablePromise(
    (id: string, file: File) => DansshipAPI.inventoryAdmin.uploadRoomImage(id, file),
  );

  const createRoom = useCallback(
    async (payload: CreateRoomPayload, imageFile?: File | null) => {
      const { ok, data } = (await createRoomPromise(payload)) ?? {};

      if (!ok || !data) {
        toast.error(t('inventory:rooms.createFailed'));

        return;
      }

      if (imageFile) {
        const uploadResult = await uploadRoomImagePromise(data.id, imageFile);

        if (!uploadResult?.ok) {
          toast.error(t('inventory:rooms.imageUploadRetryHint'));
          reFetch();

          return data;
        }
      }

      toast.success(t('inventory:rooms.createSuccess'));
      reFetch();

      return data;
    },
    [t, createRoomPromise, uploadRoomImagePromise, reFetch],
  );

  const updateRoom = useCallback(
    async (id: string, payload: UpdateRoomPayload, imageFile?: File | null) => {
      const { ok } = (await updateRoomPromise(id, payload)) ?? {};

      if (!ok) {
        toast.error(t('inventory:rooms.updateFailed'));

        return;
      }

      if (imageFile) {
        const uploadResult = await uploadRoomImagePromise(id, imageFile);

        if (!uploadResult?.ok) {
          toast.error(t('inventory:rooms.imageUploadRetryHint'));
          reFetch();

          return;
        }
      }

      toast.success(t('inventory:rooms.updateSuccess'));
      reFetch();
    },
    [t, updateRoomPromise, uploadRoomImagePromise, reFetch],
  );

  const deleteRoom = useCallback(
    async (id: string) => {
      const { ok } = await deleteRoomPromise(id);

      if (ok) {
        toast.success(t('inventory:rooms.deactivateSuccess'));
        reFetch();
      } else {
        toast.error(t('inventory:rooms.deactivateFailed'));
      }
    },
    [t, deleteRoomPromise, reFetch],
  );

  const reactivateRoom = useCallback(
    async (id: string) => {
      const { ok } = await reactivateRoomPromise(id);

      if (ok) {
        toast.success(t('inventory:rooms.reactivateSuccess'));
        reFetch();
      } else {
        toast.error(t('inventory:rooms.reactivateFailed'));
      }
    },
    [t, reactivateRoomPromise, reFetch],
  );

  return {
    rooms: rooms?.data ?? [],
    isLoading,
    createRoom,
    updateRoom,
    deleteRoom,
    reactivateRoom,
    isCreating: isCreatingRoom,
    isUpdating: isUpdatingRoom || isUploadingRoomImage,
    isDeleting: isDeletingRoom,
    isReactivating: isReactivatingRoom,
  };
};
