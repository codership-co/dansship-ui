import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { useCallablePromise } from '../use-callable-promise';
import { usePromise } from '../use-promise';

import { DansshipAPI, DANSSHIP_ERROR_CODE, DansshipAPIError, type TwoForOneWeek } from '@core/api';

const WEEK_ERROR_KEYS: Partial<Record<DANSSHIP_ERROR_CODE, string>> = {
  [DANSSHIP_ERROR_CODE.TWO_FOR_ONE_WEEK_NOT_FOUND]: 'admin:inventory.promotionsPanel.weeks.notFound',
  [DANSSHIP_ERROR_CODE.TWO_FOR_ONE_DATE_OUTSIDE_WEEK]: 'admin:inventory.promotionsPanel.weeks.outsideWeek',
  [DANSSHIP_ERROR_CODE.TWO_FOR_ONE_DATE_IN_PAST]: 'admin:inventory.promotionsPanel.weeks.inPast',
  [DANSSHIP_ERROR_CODE.TWO_FOR_ONE_WEEK_LOCKED]: 'admin:inventory.promotionsPanel.weeks.weekLocked',
};

function messageKey(error: unknown): string {
  if (error instanceof DansshipAPIError) {
    return WEEK_ERROR_KEYS[error.body.error_code] ?? 'admin:inventory.promotionsPanel.weeks.saveFailed';
  }

  return 'admin:inventory.promotionsPanel.weeks.saveFailed';
}

export const useTwoForOneWeeks = () => {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.benefitsAdmin.listTwoForOneWeeks());
  const { call: setPromise, isLoading: isSetting } = useCallablePromise((weekId: string, promoDate: string) =>
    DansshipAPI.benefitsAdmin.setTwoForOneWeek(weekId, { promo_date: promoDate }),
  );
  const { call: clearPromise, isLoading: isClearing } = useCallablePromise((weekId: string) =>
    DansshipAPI.benefitsAdmin.clearTwoForOneWeek(weekId),
  );
  const [weeks, setWeeks] = useState<Array<TwoForOneWeek>>([]);

  useEffect(() => {
    if (response?.ok && response.data) {
      setWeeks(response.data);
    }
  }, [response]);

  const replaceWeek = useCallback((week: TwoForOneWeek) => {
    setWeeks(current => current.map(item => (item.id === week.id ? week : item)));
  }, []);

  const setDay = useCallback(
    async (weekId: string, promoDate: string) => {
      const result = await setPromise(weekId, promoDate);

      if (result.ok && result.data) {
        replaceWeek(result.data);
        toast.success(t('admin:inventory.promotionsPanel.weeks.saved'));

        return true;
      }

      toast.error(t(messageKey(result.ok ? null : result.error)));

      return false;
    },
    [replaceWeek, setPromise, t],
  );

  const clearDay = useCallback(
    async (weekId: string) => {
      const result = await clearPromise(weekId);

      if (result.ok && result.data) {
        replaceWeek(result.data);
        toast.success(t('admin:inventory.promotionsPanel.weeks.cleared'));

        return true;
      }

      toast.error(t(messageKey(result.ok ? null : result.error)));

      return false;
    },
    [clearPromise, replaceWeek, t],
  );

  return {
    weeks,
    isLoading,
    isSaving: isSetting || isClearing,
    setDay,
    clearDay,
  };
};
