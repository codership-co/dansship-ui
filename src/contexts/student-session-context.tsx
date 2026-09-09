import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { useAuth } from './auth-context';

import { DansshipAPI, type ActiveSubscription, type MyBooking, type SubscriptionSummary } from '@core/api';
import { usePromise } from '@hooks';

interface StudentSessionBookingsResponse {
  data?: { items?: Array<MyBooking> } | null;
  error?: unknown;
}

interface StudentSessionContextValue {
  subscriptions: Array<ActiveSubscription>;
  summary: SubscriptionSummary | null;
  isLoadingSubscriptions: boolean;
  bookings: Array<MyBooking>;
  bookingsResponse: StudentSessionBookingsResponse | null;
  isLoadingBookings: boolean;
  bookingsError: Error | null;
  isTrialEligible: boolean;
  reFetchSubscriptions: () => Promise<unknown>;
  reFetchBookings: () => Promise<unknown>;
  reFetch: () => Promise<void>;
}

const StudentSessionContext = createContext<StudentSessionContextValue | null>(null);

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, requireOnboarding, ready } = useAuth();
  const enabled = Boolean(ready && isAuthenticated && !requireOnboarding);

  const subscriptionsQuery = usePromise(() => DansshipAPI.subscriptions.getMySubscriptions(), enabled);
  const bookingsQuery = usePromise(() => DansshipAPI.bookings.getMyBookings({ scope: 'upcoming' }), enabled);

  const reFetchSubscriptions = subscriptionsQuery.reFetch;
  const reFetchBookings = bookingsQuery.reFetch;

  const reFetch = useCallback(async () => {
    await Promise.all([reFetchSubscriptions(), reFetchBookings()]);
  }, [reFetchBookings, reFetchSubscriptions]);

  const value = useMemo<StudentSessionContextValue>(
    () => ({
      subscriptions: subscriptionsQuery.response?.data?.subscriptions ?? [],
      summary: subscriptionsQuery.response?.data?.summary ?? null,
      isLoadingSubscriptions: subscriptionsQuery.isLoading,
      bookings: bookingsQuery.response?.data?.items ?? [],
      bookingsResponse: bookingsQuery.response,
      isLoadingBookings: bookingsQuery.isLoading,
      bookingsError: bookingsQuery.error,
      isTrialEligible: subscriptionsQuery.response?.data?.summary?.trial_eligible ?? false,
      reFetchSubscriptions,
      reFetchBookings,
      reFetch,
    }),
    [
      bookingsQuery.error,
      bookingsQuery.isLoading,
      bookingsQuery.response,
      reFetch,
      reFetchBookings,
      reFetchSubscriptions,
      subscriptionsQuery.isLoading,
      subscriptionsQuery.response,
    ],
  );

  return <StudentSessionContext.Provider value={value}>{children}</StudentSessionContext.Provider>;
}

export function useStudentSession() {
  const context = useContext(StudentSessionContext);

  if (!context) {
    throw new Error('useStudentSession must be used within StudentSessionProvider');
  }

  return context;
}
