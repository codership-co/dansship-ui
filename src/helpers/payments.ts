export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function paymentMethodLabelKey(method: string): string {
  return `payments.method.${method}`;
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
  return `payments.purchaseType.${type}`;
}

export function paymentPurchaseLabel(intent: {
  purchase_type: string;
  purchase_reference?: { human_identifier?: string | null; name?: string | null } | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const reference =
    intent.purchase_reference?.human_identifier ??
    intent.purchase_reference?.name ??
    (typeof intent.metadata?.plan_name === 'string' ? intent.metadata.plan_name : null);

  if (reference) {
    return reference;
  }

  return purchaseTypeLabel(intent.purchase_type);
}
