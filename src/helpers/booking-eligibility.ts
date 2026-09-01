import { toColombiaDateKey } from './date';

import type { ActiveSubscription } from '@core/api';

/** Minutes after class start during which walk-in booking is still allowed (mirrors API BOOKING_LATE_JOIN_MINUTES). */
export const LATE_JOIN_MINUTES = 15;

export type ClassBookingEligibility =
  | { status: 'ok' }
  | { status: 'trial' }
  | { status: 'not_started'; startDate: string }
  | { status: 'expired'; expirationDate: string }
  | { status: 'no_subscription' };

function hasCreditsForClass(subscription: ActiveSubscription, classStart: Date): boolean {
  if (subscription.remaining_classes > 0) {
    return true;
  }

  const bonusRemaining = subscription.bonus_classes_remaining ?? 0;

  if (bonusRemaining <= 0) {
    return false;
  }

  if (!subscription.bonus_expires_at) {
    return true;
  }

  return new Date(subscription.bonus_expires_at) >= classStart;
}

function coversClassDay(subscription: ActiveSubscription, classStart: Date): boolean {
  const classDay = toColombiaDateKey(classStart);
  const startDay = toColombiaDateKey(subscription.start_date);
  const expirationDay = toColombiaDateKey(subscription.expiration_date);

  return startDay <= classDay && expirationDay >= classDay;
}

/**
 * True when the late-join booking window has closed (start + LATE_JOIN_MINUTES).
 */
export function isPastBookingDeadline(classStart: Date | string, now: Date = new Date()): boolean {
  const start = typeof classStart === 'string' ? new Date(classStart) : classStart;
  const deadline = new Date(start.getTime() + LATE_JOIN_MINUTES * 60_000);

  return deadline.getTime() <= now.getTime();
}

/**
 * Mirrors backend booking resolution for the modal gate:
 * trial wins on the first booking; otherwise a paid plan can cover a class
 * when the class falls on/after start_date and on/before expiration_date —
 * even if the booking happens before the plan calendar start.
 * Coverage uses America/Bogota calendar days, not clock time.
 */
export function getClassBookingEligibility(
  subscriptions: Array<ActiveSubscription>,
  classStart: Date | string,
  trialEligible = false,
): ClassBookingEligibility {
  if (trialEligible) {
    return { status: 'trial' };
  }

  const start = typeof classStart === 'string' ? new Date(classStart) : classStart;
  const classDay = toColombiaDateKey(start);
  const active = subscriptions.filter(subscription => subscription.status === 'active');

  const covering = active.filter(subscription => {
    if (!hasCreditsForClass(subscription, start)) {
      return false;
    }

    return coversClassDay(subscription, start);
  });

  if (covering.length > 0) {
    return { status: 'ok' };
  }

  const notStarted = active
    .filter(subscription => {
      if (!hasCreditsForClass(subscription, start)) {
        return false;
      }

      return toColombiaDateKey(subscription.start_date) > classDay;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  if (notStarted[0]) {
    return { status: 'not_started', startDate: notStarted[0].start_date };
  }

  const expired = active
    .filter(subscription => {
      if (!hasCreditsForClass(subscription, start)) {
        return false;
      }

      return (
        toColombiaDateKey(subscription.start_date) <= classDay &&
        toColombiaDateKey(subscription.expiration_date) < classDay
      );
    })
    .sort((a, b) => new Date(b.expiration_date).getTime() - new Date(a.expiration_date).getTime());

  if (expired[0]) {
    return { status: 'expired', expirationDate: expired[0].expiration_date };
  }

  return { status: 'no_subscription' };
}

export function canBookClassAt(
  subscriptions: Array<ActiveSubscription>,
  classStart: Date | string,
  trialEligible = false,
): boolean {
  const eligibility = getClassBookingEligibility(subscriptions, classStart, trialEligible);

  return eligibility.status === 'ok' || eligibility.status === 'trial';
}
