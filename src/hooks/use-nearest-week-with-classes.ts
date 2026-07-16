import { useCallback, useEffect, useState } from 'react';

import { DansshipAPI } from '@core/api';
import { addDaysToFormat, getMonday, getNextMonday } from '@helpers';

export function useNearestWeekWithClasses(weeksToSearch: number) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [nearestWeek, setNearestWeek] = useState<string | null>(null);

  const findNearWeekWithClasses = useCallback(async (weeksToSearch: number) => {
    setIsLoading(true);
    const baseWeek = getMonday(new Date());

    for (let i = 0; i < weeksToSearch; i++) {
      const weekCandidate = addDaysToFormat(baseWeek, i * 7);
      const { data, ok } = await DansshipAPI.schedules.getPublishedClassesByRange(
        `${weekCandidate}T00:00:00Z`,
        `${getNextMonday(weekCandidate)}T00:00:00Z`,
      );

      if (ok && data.length > 0) {
        setNearestWeek(weekCandidate);
        setIsLoading(false);

        return;
      }
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void findNearWeekWithClasses(weeksToSearch);
  }, [findNearWeekWithClasses, weeksToSearch]);

  return { nearestWeek, isLookingForNearestWeek: isLoading };
}
