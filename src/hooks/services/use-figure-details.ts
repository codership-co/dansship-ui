import { useMemo, useState } from 'react';

import { usePromise } from '../use-promise';

import { useAuth } from '@contexts';
import { DansshipAPI, TFigureId } from '@core/api';

export const useFigureDetails = (id: TFigureId) => {
  const { isAuthenticated } = useAuth();

  const [isSaving, setIsSaving] = useState(false);

  const currentFigure = usePromise(() => DansshipAPI.figures.getFigureById(id), !!id);
  const savedFigures = usePromise(() => DansshipAPI.figures.getSavedFigures(), isAuthenticated);

  const isSaved = useMemo(() => currentFigure.response?.data?.is_saved, [currentFigure.response?.data?.is_saved]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (isSaved) {
        await DansshipAPI.figures.unsaveFigure(id);
      } else {
        await DansshipAPI.figures.saveFigure({
          figure_id: id,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    figure: currentFigure.response?.data,
    isSaved,
    isSaving,
    isLoading: currentFigure.isLoading || savedFigures.isLoading,
    handleSave,
  };
};
