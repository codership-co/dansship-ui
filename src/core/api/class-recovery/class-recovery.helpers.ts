import { DANSSHIP_ERROR_CODE, DansshipAPIError } from '../dansship.error';

import type {
  ClassRecovery,
  ClassRecoveryPreview,
  ClassRecoveryReview,
  RecoverableList,
  RecoverableSubscription,
  RecoverySelection,
  UserClassRecoveries,
} from './class-recovery.models';

/** The API sends decimals as strings; the UI works with numbers. */
export function toAmount(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;

  const parsed = typeof value === 'number' ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}

function toOptionalAmount(value: unknown): number | null {
  return value === null || value === undefined ? null : toAmount(value);
}

export function normalizeRecoverableSubscription(group: RecoverableSubscription): RecoverableSubscription {
  return {
    ...group,
    unit_price: toAmount(group.unit_price),
    unused_in_review: group.unused_in_review ?? 0,
    classes: (group.classes ?? []).map(item => ({
      ...item,
      unit_price: toAmount(item.unit_price),
      in_review: Boolean(item.in_review),
    })),
  };
}

/**
 * What a plan still lets the person select: whatever is not already in a payment
 * under review. Unused credits are a quantity, so each payment takes its share
 * and what is left stays selectable.
 */
export function selectableInGroup(group: RecoverableSubscription): { bookingIds: Array<string>; unused: number } {
  return {
    bookingIds: group.classes.filter(item => !item.in_review).map(item => item.booking_id),
    unused: group.unused_credits,
  };
}

export function normalizeRecoverableList(data: RecoverableList): RecoverableList {
  return { ...data, subscriptions: (data.subscriptions ?? []).map(normalizeRecoverableSubscription) };
}

export function normalizeClassRecoveryPreview(data: ClassRecoveryPreview): ClassRecoveryPreview {
  return {
    ...data,
    total_amount: toAmount(data.total_amount),
    tax_amount: toAmount(data.tax_amount),
    wallet_applied: toAmount(data.wallet_applied),
    amount_to_charge: toAmount(data.amount_to_charge),
  };
}

export function normalizeClassRecovery(data: ClassRecovery): ClassRecovery {
  return {
    ...data,
    total_amount: toAmount(data.total_amount),
    wallet_applied: toAmount(data.wallet_applied),
    amount_to_charge: toAmount(data.amount_to_charge),
    wallet_returned_amount: toOptionalAmount(data.wallet_returned_amount),
    lines: (data.lines ?? []).map(line => ({
      ...line,
      unit_price: toAmount(line.unit_price),
      tax_amount: toAmount(line.tax_amount),
    })),
  };
}

export function normalizeClassRecoveries(data: Array<ClassRecovery>): Array<ClassRecovery> {
  return (data ?? []).map(normalizeClassRecovery);
}

export function normalizeClassRecoveryReview(data: ClassRecoveryReview): ClassRecoveryReview {
  return { ...data, recovery: normalizeClassRecovery(data.recovery) };
}

export function normalizeUserClassRecoveries(data: UserClassRecoveries): UserClassRecoveries {
  return {
    recoverable: (data.recoverable ?? []).map(normalizeRecoverableSubscription),
    recoveries: normalizeClassRecoveries(data.recoveries),
    courtesy: data.courtesy ?? [],
  };
}

/** Total for a selection, using the server prices already in the list. */
export function selectionTotal(
  groups: Array<RecoverableSubscription>,
  bookingIds: ReadonlySet<string>,
  unused: Readonly<Record<string, number>>,
): { classes: number; amount: number } {
  let classes = 0;
  let amount = 0;

  for (const group of groups) {
    for (const item of group.classes) {
      if (bookingIds.has(item.booking_id)) {
        classes += 1;
        amount += item.unit_price;
      }
    }

    const quantity = unused[group.subscription_id] ?? 0;

    classes += quantity;
    amount += quantity * group.unit_price;
  }

  return { classes, amount };
}

export interface SelectedRecoveryLine {
  key: string;
  kind: 'lost_booking' | 'unused_credit';
  planName: string;
  className: string | null;
  attendeeName: string | null;
  classStart: string | null;
  quantity: number;
  unitPrice: number;
}

/** The items a selection covers, in list order, for the review step of the checkout. */
export function selectedRecoveryLines(
  groups: Array<RecoverableSubscription>,
  selection: RecoverySelection,
): Array<SelectedRecoveryLine> {
  const bookingIds = new Set(selection.booking_ids);
  const lines: Array<SelectedRecoveryLine> = [];

  for (const group of groups) {
    for (const item of group.classes) {
      if (bookingIds.has(item.booking_id)) {
        lines.push({
          key: item.booking_id,
          kind: 'lost_booking',
          planName: group.plan_name,
          className: item.class_name,
          attendeeName: item.attendee_name,
          classStart: item.class_start,
          quantity: 1,
          unitPrice: item.unit_price,
        });
      }
    }

    const quantity = selection.unused_credits.find(entry => entry.subscription_id === group.subscription_id)?.quantity;

    if (quantity) {
      lines.push({
        key: `unused-${group.subscription_id}`,
        kind: 'unused_credit',
        planName: group.plan_name,
        className: null,
        attendeeName: null,
        classStart: null,
        quantity,
        unitPrice: group.unit_price,
      });
    }
  }

  return lines;
}

const RECOVERY_ERROR_CODES = new Set<string>([
  DANSSHIP_ERROR_CODE.CLASS_RECOVERY_EMPTY_SELECTION,
  DANSSHIP_ERROR_CODE.CLASS_RECOVERY_NOT_RECOVERABLE,
  DANSSHIP_ERROR_CODE.CLASS_RECOVERY_PAYMENT_PENDING,
  DANSSHIP_ERROR_CODE.CLASS_RECOVERY_INVALID_PAYMENT_METHOD,
  DANSSHIP_ERROR_CODE.CLASS_RECOVERY_NOT_FOUND,
  DANSSHIP_ERROR_CODE.CLASS_RECOVERY_SETTINGS_INVALID,
]);

/** i18n key for a class recovery API error. */
export function classRecoveryErrorKey(error: unknown): string {
  if (error instanceof DansshipAPIError && RECOVERY_ERROR_CODES.has(error.body.error_code)) {
    return `errors:codes.${error.body.error_code}`;
  }

  return 'recovery:errors.generic';
}
