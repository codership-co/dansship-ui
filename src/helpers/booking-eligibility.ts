import type { ActiveSubscription } from '@core/api';

export type ClassBookingEligibility =
  | { status: 'ok' }
  | { status: 'trial' }
  | { status: 'not_started'; startDate: string }
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

/**
 * Mirrors backend booking resolution for the modal gate:
 * trial wins on the first booking; otherwise a paid plan can cover a class
 * when the class falls on/after start_date and on/before expiration_date —
 * even if the booking happens before the plan calendar start.
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
  const active = subscriptions.filter(subscription => subscription.status === 'active');

  const covering = active.filter(subscription => {
    if (!hasCreditsForClass(subscription, start)) {
      return false;
    }

    return new Date(subscription.start_date) <= start && new Date(subscription.expiration_date) >= start;
  });

  if (covering.length > 0) {
    return { status: 'ok' };
  }

  const notStarted = active
    .filter(subscription => {
      if (!hasCreditsForClass(subscription, start)) {
        return false;
      }

      return new Date(subscription.start_date) > start;
    })
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  if (notStarted[0]) {
    return { status: 'not_started', startDate: notStarted[0].start_date };
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
