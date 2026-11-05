import { describe, expect, it } from 'vitest';

import { ASSISTED_TAB, ASSISTED_TAB_ORDER, canSeeTab } from './assisted-tabs';

import { AssistedPagePermissions, PERMISSION } from '@core/permissions';

const visibleFor = (...granted: Array<PERMISSION>) =>
  ASSISTED_TAB_ORDER.filter(tab => canSeeTab(tab, permissions => permissions.some(p => granted.includes(p))));

describe('assisted attention tabs', () => {
  it('shows only Contactos to someone with just the contact lead permissions', () => {
    expect(visibleFor(PERMISSION.CONTACT_LEAD_READ, PERMISSION.CONTACT_LEAD_MANAGE)).toEqual([ASSISTED_TAB.contacts]);
  });

  it('shows Cuenta when any of its sub-tab permissions is held', () => {
    expect(visibleFor(PERMISSION.USER_ACCOUNTS_MERGE)).toEqual([ASSISTED_TAB.account]);
    expect(visibleFor(PERMISSION.ACCOUNT_LINKS_MANAGE)).toEqual([ASSISTED_TAB.account]);
  });

  it('maps each remaining tab to its own permission', () => {
    expect(visibleFor(PERMISSION.PLAN_PURCHASE_REGISTER)).toEqual([ASSISTED_TAB.plan]);
    expect(visibleFor(PERMISSION.BOOKING_MANAGE)).toEqual([ASSISTED_TAB.class]);
    expect(visibleFor(PERMISSION.EVENT_INSTALLMENT_PAYMENT_REGISTER)).toEqual([ASSISTED_TAB.event]);
    expect(visibleFor(PERMISSION.BENEFIT_GRANT)).toEqual([ASSISTED_TAB.benefits]);
  });

  it('shows nothing without any tab permission, and the page opens with any of them', () => {
    expect(visibleFor(PERMISSION.USER_READ)).toEqual([]);
    expect(AssistedPagePermissions).toContain(PERMISSION.CONTACT_LEAD_READ);
    expect(AssistedPagePermissions).not.toContain(PERMISSION.USER_READ);
  });
});
