import { useCallback, useEffect, useRef, useState } from 'react';

import { usePageResume } from '../use-page-resume';

import { DansshipAPI, type MyBooking } from '@core/api';
import { whenSessionSettled } from '@core/api/session-coordinator';

export const MY_BOOKINGS_HISTORY_PAGE_SIZE = 20;

export function useMyBookingsHistory(attendeeUserId?: string) {
  const [items, setItems] = useState<Array<MyBooking>>([]);
  const [offset, setOffset] = useState<number | undefined>(0);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);
  const attendeeRef = useRef(attendeeUserId);
  const hasItemsRef = useRef(false);
  const pendingLoad = useRef<{
    nextOffset: number;
    append: boolean;
    forAttendee?: string;
    background: boolean;
  } | null>(null);
  const pendingWaiters = useRef<Array<() => void>>([]);

  attendeeRef.current = attendeeUserId;
  hasItemsRef.current = items.length > 0;

  const loadPage = useCallback(
    async (nextOffset: number, append: boolean, forAttendee?: string, background = false) => {
      if (forAttendee !== attendeeRef.current) {
        return;
      }

      if (inFlightRef.current) {
        pendingLoad.current = { nextOffset, append, forAttendee, background };

        return new Promise<void>(resolve => {
          pendingWaiters.current.push(resolve);
        });
      }

      const requestId = ++requestIdRef.current;

      inFlightRef.current = true;

      if (!background) {
        setError(null);
      }

      if (append) {
        setIsLoadingMore(true);
      } else if (!background) {
        setIsLoading(true);
      }

      try {
        const { data, error: requestError } = await DansshipAPI.bookings.getMyBookings({
          scope: 'history',
          limit: MY_BOOKINGS_HISTORY_PAGE_SIZE,
          offset: nextOffset,
          ...(forAttendee ? { attendee_user_id: forAttendee } : {}),
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        if (requestError || !data) {
          if (!background) {
            setError(requestError ?? new Error('Failed to load booking history'));
          }

          return;
        }

        setError(null);

        setTotal(data.total);
        const loaded = nextOffset + data.items.length;
        setOffset(loaded < data.total ? loaded : undefined);
        setItems(previous =>
          append
            ? [...previous, ...data.items.filter(item => !previous.some(existing => existing.id === item.id))]
            : data.items,
        );
      } catch (err) {
        if (requestId !== requestIdRef.current) {
          return;
        }

        if (!background) {
          setError(err instanceof Error ? err : new Error('Failed to load booking history'));
        }
      } finally {
        if (requestId === requestIdRef.current) {
          inFlightRef.current = false;

          if (!background) {
            setIsLoading(false);
          }

          setIsLoadingMore(false);

          const pending = pendingLoad.current;

          if (pending) {
            pendingLoad.current = null;
            await loadPage(pending.nextOffset, pending.append, pending.forAttendee, pending.background);
          }

          const waiters = pendingWaiters.current;

          pendingWaiters.current = [];
          waiters.forEach(resolve => resolve());
        }
      }
    },
    [],
  );

  useEffect(() => {
    inFlightRef.current = false;
    requestIdRef.current += 1;
    pendingLoad.current = null;
    const waiters = pendingWaiters.current;

    pendingWaiters.current = [];
    waiters.forEach(resolve => resolve());
    setItems([]);
    setOffset(0);
    setTotal(0);
    void loadPage(0, false, attendeeUserId);
  }, [attendeeUserId, loadPage]);

  usePageResume(() => {
    void (async () => {
      await whenSessionSettled();
      await loadPage(0, false, attendeeRef.current, hasItemsRef.current);
    })();
  });

  const loadNextPage = useCallback(async () => {
    if (offset === undefined || inFlightRef.current) {
      return;
    }

    await loadPage(offset, true, attendeeUserId);
  }, [attendeeUserId, loadPage, offset]);

  const reFetch = useCallback(async () => {
    setOffset(0);
    await loadPage(0, false, attendeeUserId);
  }, [attendeeUserId, loadPage]);

  return {
    items,
    total,
    isLoading,
    isLoadingMore,
    error,
    hasMore: items.length < total,
    loadNextPage,
    reFetch,
  };
}
