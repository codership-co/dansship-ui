import { DansshipAPI, type MyBooking, type User } from '@core/api';
import { PageURLS } from '@core/constants';

const AUTH_PATH_PREFIX = '/auth/';

/**
 * Deep links worth restoring after login. Marketing home and auth flows are not destinations.
 */
export function isValidReturnPath(path?: string | null): path is string {
  if (!path) {
    return false;
  }

  const pathname = path.split('?')[0]?.split('#')[0] ?? '';

  if (!pathname || pathname === PageURLS.home) {
    return false;
  }

  if (pathname === PageURLS.auth.login || pathname.startsWith(AUTH_PATH_PREFIX)) {
    return false;
  }

  return true;
}

/**
 * Sync role home. Priority: admin > instructor > student default (classes).
 * Students with upcoming bookings are resolved asynchronously via `resolvePostLoginPath`.
 */
export function getRedirectPathByRole(roles?: Array<string>): string {
  if (!roles || roles.length === 0) {
    return PageURLS.classes;
  }

  const normalized = roles.map(role => role.toLowerCase());

  if (normalized.includes('admin')) {
    return PageURLS.admin.reports;
  }

  if (normalized.includes('instructor')) {
    return PageURLS.instructor.root;
  }

  return PageURLS.classes;
}

export function hasUpcomingActiveBookings(bookings: Array<MyBooking>, now = new Date()): boolean {
  const nowMs = now.getTime();

  return bookings.some(booking => {
    if (booking.status !== 'active' && booking.status !== 'waitlisted') {
      return false;
    }

    return new Date(booking.scheduled_class.start_time).getTime() > nowMs;
  });
}

/**
 * Resolves the post-login destination for the user's primary role.
 * Students with upcoming active/waitlisted bookings go to bookings; otherwise classes.
 * Skips bookings lookup when onboarding is incomplete (API returns ONBOARDING_REQUIRED).
 * Soft-fails to classes if the bookings request errors.
 */
export async function resolvePostLoginPath(
  user: Pick<User, 'roles' | 'requiresOnboarding' | 'onboardingCompleted'>,
): Promise<string> {
  const roles = (user.roles ?? []).map(role => role.toLowerCase());
  const syncPath = getRedirectPathByRole(user.roles);

  if (roles.includes('admin') || roles.includes('instructor')) {
    return syncPath;
  }

  if (user.requiresOnboarding && !user.onboardingCompleted) {
    return PageURLS.classes;
  }

  try {
    const response = await DansshipAPI.bookings.getMyBookings();

    if (response.ok && hasUpcomingActiveBookings(response.data ?? [])) {
      return PageURLS.profile.bookings;
    }
  } catch {
    // Fail soft: bookable path is safer than marketing home.
  }

  return PageURLS.classes;
}
