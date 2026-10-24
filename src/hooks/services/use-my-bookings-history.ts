import { useCallback, useEffect, useRef, useState } from 'react';

import { DansshipAPI, type MyBooking } from '@core/api';

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

  const loadPage = useCallback(async (nextOffset: number, append: boolean, forAttendee?: string) => {
    if (inFlightRef.current) {
      return;
    }

    const requestId = ++requestIdRef.current;

    inFlightRef.current = true;
    setError(null);

    if (append) {
      setIsLoadingMore(true);
    } else {
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
        setError(requestError ?? new Error('Failed to load booking history'));

        return;
      }

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

      setError(err instanceof Error ? err : new Error('Failed to load booking history'));
    } finally {
      if (requestId === requestIdRef.current) {
        inFlightRef.current = false;
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    inFlightRef.current = false;
    requestIdRef.current += 1;
    setItems([]);
    setOffset(0);
    setTotal(0);
    void loadPage(0, false, attendeeUserId);
  }, [attendeeUserId, loadPage]);

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
