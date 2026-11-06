import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

import { DansshipAPI, type PersonSearchResult } from '@core/api';

const USER_PARAM = 'user';

/**
 * The person every tab of Atención asistida works on. It lives in the URL
 * (`?user=`) so "Dar atención" can preselect it and tabs share it.
 */
export function useSelectedPerson() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get(USER_PARAM);
  const [person, setPerson] = useState<PersonSearchResult | null>(null);

  useEffect(() => {
    if (!userId) {
      setPerson(null);

      return;
    }

    if (person?.id === userId) {
      return;
    }

    let cancelled = false;

    void DansshipAPI.usersAdmin
      .getById(userId)
      .then(response => {
        if (cancelled) {
          return;
        }

        setPerson(
          response.ok && response.data
            ? {
                id: userId,
                full_name: response.data.full_name ?? response.data.email,
                email: response.data.email,
              }
            : { id: userId, full_name: '', email: null },
        );
      })
      .catch(() => !cancelled && setPerson({ id: userId, full_name: '', email: null }));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const select = useCallback(
    (next: PersonSearchResult | null) => {
      setPerson(next);
      setSearchParams(
        previous => {
          const params = new URLSearchParams(previous);

          if (next) {
            params.set(USER_PARAM, next.id);
          } else {
            params.delete(USER_PARAM);
          }

          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { userId, person: userId ? person : null, select };
}
