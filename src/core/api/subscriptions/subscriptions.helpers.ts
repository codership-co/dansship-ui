import type { ActiveSubscription, PublicPlan } from './subscriptions.models';

export function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

export function normalizePlan(plan: PublicPlan): PublicPlan {
  return {
    ...plan,
    price: toNumber(plan.price),
    classes_included: toNumber(plan.classes_included),
    validity_days: toNumber(plan.validity_days),
  };
}

export function normalizeSubscription(subscription: ActiveSubscription): ActiveSubscription {
  return {
    ...subscription,
    remaining_classes: toNumber(subscription.remaining_classes),
    original_price: toNumber(subscription.original_price),
    final_price: toNumber(subscription.final_price),
    class_count_snapshot: toNumber(subscription.class_count_snapshot),
    price_snapshot: toNumber(subscription.price_snapshot),
    discount_value_snapshot:
      subscription.discount_value_snapshot !== null ? toNumber(subscription.discount_value_snapshot) : null,
    plan: subscription.plan ? normalizePlan(subscription.plan) : subscription.plan,
  };
}
