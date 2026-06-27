import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import {
  DansshipAPI,
  FigureAdminCreatePayload,
  type FigureAdminUpdatePayload,
  GetAdminFiguresParams,
  type TFigureId,
} from '@core/api';

export const useAdminFigures = (filters: GetAdminFiguresParams) => {
  const { t } = useTranslation();
  const { response: figures, isLoading } = usePromise(() => DansshipAPI.figuresAdmin.getAdminFigures(filters));

  const { call: createAdminFigurePromise, isLoading: isLoadingCreateAdminFigure } = useCallablePromise(
    (payload: FigureAdminCreatePayload) => DansshipAPI.figuresAdmin.createAdminFigure(payload),
  );
  const { call: updateAdminFigurePromise, isLoading: isLoadingUpdateAdminFigure } = useCallablePromise(
    (id: TFigureId, payload: FigureAdminUpdatePayload) => DansshipAPI.figuresAdmin.updateAdminFigure(id, payload),
  );
  const { call: approveAdminFigurePromise, isLoading: isLoadingApproveAdminFigure } = useCallablePromise(
    (id: TFigureId) => DansshipAPI.figuresAdmin.approveAdminFigure(id),
  );
  const { call: deleteAdminFigurePromise, isLoading: isLoadingDeleteAdminFigure } = useCallablePromise(
    (id: TFigureId) => DansshipAPI.figuresAdmin.deleteAdminFigure(id),
  );
  const {
    call: importAdminFiguresCsvPromise,
    isLoading: isLoadingImportAdminFiguresCsv,
    response: importAdminFiguresCsvData,
  } = useCallablePromise((file: File) => DansshipAPI.figuresAdmin.importAdminFiguresCsv(file));
  const { call: uploadAdminFigureImagePromise, isLoading: isLoadingUploadAdminFigureImage } = useCallablePromise(
    (id: TFigureId, file: File) => DansshipAPI.figuresAdmin.uploadAdminFigureImage(id, file),
  );
  const { call: deleteAdminFigureImagePromise, isLoading: isLoadingDeleteAdminFigureImage } = useCallablePromise(
    (id: TFigureId, fileKey: string) => DansshipAPI.figuresAdmin.deleteAdminFigureImage(id, fileKey),
  );

  const createAdminFigure = useCallback(
    async (payload: FigureAdminCreatePayload) => {
      const { ok, data } = await createAdminFigurePromise(payload);

      if (ok) {
        toast.success(t('figures.admin.createSuccess', { defaultValue: 'Figure created.' }));
      } else {
        toast.error('Unable to create figure.');
      }

      return data;
    },
    [createAdminFigurePromise, t],
  );

  const updateAdminFigure = useCallback(
    async (id: TFigureId, payload: FigureAdminUpdatePayload) => {
      const { ok, data } = await updateAdminFigurePromise(id, payload);

      if (ok) {
        toast.success(t('figures.admin.updateSuccess', { defaultValue: 'Figure updated.' }));
      } else {
        toast.error('Unable to update figure.');
      }

      return data;
    },
    [updateAdminFigurePromise, t],
  );

  const approveAdminFigure = useCallback(
    async (id: TFigureId) => {
      const { ok, data } = await approveAdminFigurePromise(id);

      if (ok) {
        toast.success(t('figures.admin.approveSuccess', { defaultValue: 'Figure approved.' }));
      } else {
        toast.error('Unable to approve figure.');
      }

      return data;
    },
    [approveAdminFigurePromise, t],
  );

  const deleteAdminFigure = useCallback(
    async (id: TFigureId) => {
      const { ok, data } = await deleteAdminFigurePromise(id);

      if (ok) {
        toast.success(t('figures.admin.deleteSuccess', { defaultValue: 'Figure deleted.' }));
      } else {
        toast.error('Unable to delete figure.');
      }

      return data;
    },
    [deleteAdminFigurePromise, t],
  );

  const importAdminFiguresCsv = useCallback(
    async (file: File) => {
      const { ok, data } = await importAdminFiguresCsvPromise(file);

      if (ok) {
        toast.success(
          t('figures.admin.importSuccess', {
            defaultValue: 'Import completed: {{count}} created.',
            count: data.created,
          }),
        );
      } else {
        toast.error('Unable to import figures CSV.');
      }

      return data;
    },
    [importAdminFiguresCsvPromise, t],
  );

  const uploadAdminFigureImage = useCallback(
    async (id: TFigureId, file: File) => {
      const { ok, data } = (await uploadAdminFigureImagePromise(id, file)) ?? {};

      if (ok) {
        toast.success(t('figures.admin.imageUploadSuccess', { defaultValue: 'Image uploaded.' }));
      } else {
        toast.error('Unable to upload image.');
      }

      return data;
    },
    [uploadAdminFigureImagePromise, t],
  );

  const deleteAdminFigureImage = useCallback(
    async (id: TFigureId, fileKey: string) => {
      const { ok, data } = await deleteAdminFigureImagePromise(id, fileKey);

      if (ok) {
        toast.success(t('figures.admin.imageRemoveSuccess', { defaultValue: 'Image removed.' }));
      } else {
        toast.error('Unable to remove image.');
      }

      return data;
    },
    [deleteAdminFigureImagePromise, t],
  );

  return {
    figures: figures?.data?.data ?? [],
    total: figures?.data?.total ?? 0,
    isLoading,
    createFigure: createAdminFigure,
    updateFigure: updateAdminFigure,
    approveFigure: approveAdminFigure,
    deleteFigure: deleteAdminFigure,
    importFiguresCsv: importAdminFiguresCsv,
    uploadFigureImage: uploadAdminFigureImage,
    removeFigureImage: deleteAdminFigureImage,
    importResult: importAdminFiguresCsvData?.data ?? null,
    isCreating: isLoadingCreateAdminFigure,
    isUpdating: isLoadingUpdateAdminFigure,
    isApproving: isLoadingApproveAdminFigure,
    isDeleting: isLoadingDeleteAdminFigure,
    isImporting: isLoadingImportAdminFiguresCsv,
    isUploadingImage: isLoadingUploadAdminFigureImage,
    isRemovingImage: isLoadingDeleteAdminFigureImage,
  };
};
