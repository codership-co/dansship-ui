const PLAN_CHECKOUT_INTENT_KEY = 'pending_plan_checkout_intent';
const PLAN_CHECKOUT_INTENT_TTL_MS = 1000 * 60 * 60 * 6;

interface PlanCheckoutIntent {
  planId: string;
  createdAt: number;
}

const isValidIntent = (value: unknown): value is PlanCheckoutIntent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeIntent = value as Partial<PlanCheckoutIntent>;

  return typeof maybeIntent.planId === 'string' && typeof maybeIntent.createdAt === 'number';
};

export const setPendingPlanCheckoutIntent = (planId: string) => {
  const payload: PlanCheckoutIntent = {
    planId,
    createdAt: Date.now(),
  };

  localStorage.setItem(PLAN_CHECKOUT_INTENT_KEY, JSON.stringify(payload));
};

export const clearPendingPlanCheckoutIntent = () => {
  localStorage.removeItem(PLAN_CHECKOUT_INTENT_KEY);
};

export const getPendingPlanCheckoutIntent = (): string | null => {
  const rawValue = localStorage.getItem(PLAN_CHECKOUT_INTENT_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!isValidIntent(parsedValue)) {
      clearPendingPlanCheckoutIntent();

      return null;
    }

    const isExpired = Date.now() - parsedValue.createdAt > PLAN_CHECKOUT_INTENT_TTL_MS;

    if (isExpired) {
      clearPendingPlanCheckoutIntent();

      return null;
    }

    return parsedValue.planId;
  } catch {
    clearPendingPlanCheckoutIntent();

    return null;
  }
};

export const consumePendingPlanCheckoutIntent = (): string | null => {
  const planId = getPendingPlanCheckoutIntent();
  clearPendingPlanCheckoutIntent();

  return planId;
};

const TALLER_CHECKOUT_INTENT_KEY = 'pending_evento_checkout_intent';

interface EventoCheckoutIntent {
  slug: string;
  createdAt: number;
}

const isValidEventoIntent = (value: unknown): value is EventoCheckoutIntent => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const maybeIntent = value as Partial<EventoCheckoutIntent>;

  return typeof maybeIntent.slug === 'string' && typeof maybeIntent.createdAt === 'number';
};

export const setPendingEventoCheckoutIntent = (slug: string) => {
  const payload: EventoCheckoutIntent = {
    slug,
    createdAt: Date.now(),
  };

  localStorage.setItem(TALLER_CHECKOUT_INTENT_KEY, JSON.stringify(payload));
};

export const clearPendingEventoCheckoutIntent = () => {
  localStorage.removeItem(TALLER_CHECKOUT_INTENT_KEY);
};

export const getPendingEventoCheckoutIntent = (): string | null => {
  const rawValue = localStorage.getItem(TALLER_CHECKOUT_INTENT_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    if (!isValidEventoIntent(parsedValue)) {
      clearPendingEventoCheckoutIntent();

      return null;
    }

    const isExpired = Date.now() - parsedValue.createdAt > PLAN_CHECKOUT_INTENT_TTL_MS;

    if (isExpired) {
      clearPendingEventoCheckoutIntent();

      return null;
    }

    return parsedValue.slug;
  } catch {
    clearPendingEventoCheckoutIntent();

    return null;
  }
};

export const consumePendingEventoCheckoutIntent = (): string | null => {
  const slug = getPendingEventoCheckoutIntent();
  clearPendingEventoCheckoutIntent();

  return slug;
};
