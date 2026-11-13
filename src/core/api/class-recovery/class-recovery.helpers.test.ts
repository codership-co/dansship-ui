import { describe, expect, it } from 'vitest';

import { DANSSHIP_ERROR_CATEGORY, DANSSHIP_ERROR_CODE, DansshipAPIError } from '../dansship.error';

import {
  classRecoveryErrorKey,
  normalizeClassRecovery,
  normalizeRecoverableList,
  selectableInGroup,
  selectedRecoveryLines,
  selectionTotal,
  toAmount,
} from './class-recovery.helpers';

import type { ClassRecovery, RecoverableList } from './class-recovery.models';

const list = {
  settings: { recovery_window_days: 15, recovery_grace_days: 7, recovery_extension_days: 7 },
  subscriptions: [
    {
      subscription_id: 'sub-1',
      plan_id: 'plan-1',
      plan_name: 'Baile x8',
      plan_state: 'active',
      expiration_date: '2026-11-20T00:00:00Z',
      grace_deadline: null,
      unit_price: '12000.00',
      unused_credits: 0,
      classes: [
        {
          booking_id: 'b-1',
          attendee_user_id: 'u-1',
          attendee_name: null,
          class_name: 'Champeta',
          class_start: '2026-11-09T20:00:00Z',
          class_end: null,
          instructor_name: 'Michael',
          loss_reason: 'no_show',
          unit_price: '12000.00',
          deadline: '2026-11-24',
        },
      ],
    },
    {
      subscription_id: 'sub-2',
      plan_id: 'plan-2',
      plan_name: 'Mix x4',
      plan_state: 'expired_in_grace',
      expiration_date: '2026-11-08T00:00:00Z',
      grace_deadline: '2026-11-15',
      unit_price: '15000.00',
      unused_credits: 2,
      classes: [],
    },
  ],
} as unknown as RecoverableList;

describe('class recovery helpers', () => {
  it('normalizes API decimals to numbers', () => {
    const normalized = normalizeRecoverableList(list);

    expect(normalized.subscriptions[0].unit_price).toBe(12000);
    expect(normalized.subscriptions[0].classes[0].unit_price).toBe(12000);
  });

  it('totals selected lost classes and unused credits with server prices', () => {
    const groups = normalizeRecoverableList(list).subscriptions;

    expect(selectionTotal(groups, new Set(['b-1']), { 'sub-2': 2 })).toEqual({ classes: 3, amount: 42000 });
    expect(selectionTotal(groups, new Set(), {})).toEqual({ classes: 0, amount: 0 });
  });

  it('describes what a selection covers, in list order', () => {
    const groups = normalizeRecoverableList(list).subscriptions;
    const lines = selectedRecoveryLines(groups, {
      booking_ids: ['b-1'],
      unused_credits: [{ subscription_id: 'sub-2', quantity: 2 }],
    });

    expect(lines.map(line => [line.kind, line.quantity, line.unitPrice])).toEqual([
      ['lost_booking', 1, 12000],
      ['unused_credit', 2, 15000],
    ]);
    expect(lines[0]).toMatchObject({ className: 'Champeta', planName: 'Baile x8' });
    expect(selectedRecoveryLines(groups, { booking_ids: [], unused_credits: [] })).toEqual([]);
  });

  it('blocks what is in a payment under review', () => {
    const [plain] = normalizeRecoverableList(list).subscriptions;
    const group = {
      ...plain,
      unused_credits: 2,
      unused_in_review: 0,
      classes: [
        { ...plain.classes[0], booking_id: 'free', in_review: false },
        { ...plain.classes[0], booking_id: 'paid', in_review: true },
      ],
    };

    expect(selectableInGroup(group)).toEqual({ bookingIds: ['free'], unused: 2 });
    // Credits already in a payment are not counted in `unused_credits`: the rest stays selectable.
    expect(selectableInGroup({ ...group, unused_in_review: 1 })).toEqual({ bookingIds: ['free'], unused: 2 });
  });

  it('defaults the review flags when the API omits them', () => {
    const [group] = normalizeRecoverableList(list).subscriptions;

    expect(group.unused_in_review).toBe(0);
    expect(group.classes[0].in_review).toBe(false);
  });

  it('keeps an empty wallet return as null', () => {
    const recovery = normalizeClassRecovery({
      total_amount: '12000.00',
      wallet_applied: '0.00',
      amount_to_charge: '12000.00',
      wallet_returned_amount: null,
      lines: [],
    } as unknown as ClassRecovery);

    expect(recovery.total_amount).toBe(12000);
    expect(recovery.wallet_returned_amount).toBeNull();
  });

  it('treats invalid amounts as zero', () => {
    expect(toAmount('abc')).toBe(0);
    expect(toAmount(undefined)).toBe(0);
  });

  it('maps recovery error codes and falls back to a generic message', () => {
    const error = new DansshipAPIError(
      {
        category: DANSSHIP_ERROR_CATEGORY.CONFLICT,
        error_code: DANSSHIP_ERROR_CODE.CLASS_RECOVERY_PAYMENT_PENDING,
        message: 'pending',
        status: 409,
        timestamp: new Date(0).toISOString(),
        path: '/class-recoveries',
        details: {},
      } as never,
      409,
      'pending',
    );

    expect(classRecoveryErrorKey(error)).toBe('errors:codes.CLASS_RECOVERY_PAYMENT_PENDING');
    expect(classRecoveryErrorKey(new Error('boom'))).toBe('recovery:errors.generic');
  });
});
