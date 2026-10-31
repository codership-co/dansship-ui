export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function paymentMethodLabelKey(method: string): string {
  return `payments:method.${method}`;
}

function titleCase(value: string): string {
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function purchaseTypeLabel(type: string): string {
  return titleCase(type);
}

export function purchaseTypeLabelKey(type: string): string {
  return `payments:purchaseType.${type}`;
}

export function paymentPurchaseLabel(intent: {
  purchase_type: string;
  purchase_reference?: { human_identifier?: string | null; name?: string | null } | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const reference =
    intent.purchase_reference?.human_identifier ??
    intent.purchase_reference?.name ??
    (typeof intent.metadata?.plan_name === 'string' ? intent.metadata.plan_name : null) ??
    (typeof intent.metadata?.name === 'string' ? intent.metadata.name : null);

  if (reference) {
    return reference;
  }

  return purchaseTypeLabel(intent.purchase_type);
}

export interface PartialFixedCoverage {
  startDay: number;
  endDay: number;
  month: number;
  year: string;
  daysCovered: number;
  daysInMonth: number;
}

export function partialFixedCoverage(document: {
  calculation_snapshot?: {
    components?: Array<{
      payment_type?: string;
      covered_start?: string;
      covered_end?: string;
      days_covered?: number;
      days_in_month?: number;
    }>;
  } | null;
}): PartialFixedCoverage | null {
  const fixed = document.calculation_snapshot?.components?.find(item => item.payment_type === 'fixed_amount');

  if (!fixed?.covered_start || !fixed.covered_end) return null;

  if (typeof fixed.days_covered !== 'number' || typeof fixed.days_in_month !== 'number') return null;

  if (Number(fixed.days_covered) >= Number(fixed.days_in_month)) return null;

  return {
    startDay: Number(fixed.covered_start.slice(8, 10)),
    endDay: Number(fixed.covered_end.slice(8, 10)),
    month: Number(fixed.covered_start.slice(5, 7)),
    year: fixed.covered_start.slice(0, 4),
    daysCovered: Number(fixed.days_covered),
    daysInMonth: Number(fixed.days_in_month),
  };
}
