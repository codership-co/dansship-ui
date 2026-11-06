import { AssistedPermissions, PERMISSION } from '@core/permissions';

export const ASSISTED_TAB = {
  account: 'account',
  plan: 'plan',
  class: 'class',
  event: 'event',
  contacts: 'contacts',
  benefits: 'benefits',
} as const;

export type AssistedTab = (typeof ASSISTED_TAB)[keyof typeof ASSISTED_TAB];

export const ACCOUNT_SUBTAB = {
  create: 'create',
  data: 'data',
  links: 'links',
  merge: 'merge',
} as const;

export type AccountSubtab = (typeof ACCOUNT_SUBTAB)[keyof typeof ACCOUNT_SUBTAB];

export const ACCOUNT_SUBTAB_PERMISSIONS: Record<AccountSubtab, Array<PERMISSION>> = {
  create: AssistedPermissions.accountCreate,
  data: AssistedPermissions.accountData,
  links: AssistedPermissions.accountLinks,
  merge: AssistedPermissions.accountMerge,
};

export const ASSISTED_TAB_ORDER: Array<AssistedTab> = [
  ASSISTED_TAB.account,
  ASSISTED_TAB.plan,
  ASSISTED_TAB.class,
  ASSISTED_TAB.event,
  ASSISTED_TAB.benefits,
  ASSISTED_TAB.contacts,
];

/** A tab is visible when the user holds any permission it needs. */
export function canSeeTab(tab: AssistedTab, has: (permissions: Array<PERMISSION>) => boolean): boolean {
  switch (tab) {
    case ASSISTED_TAB.account:
      return Object.values(ACCOUNT_SUBTAB_PERMISSIONS).some(has);
    case ASSISTED_TAB.plan:
      return has(AssistedPermissions.plan);
    case ASSISTED_TAB.class:
      return has(AssistedPermissions.class);
    case ASSISTED_TAB.event:
      return has(AssistedPermissions.event);
    case ASSISTED_TAB.contacts:
      return has(AssistedPermissions.contacts);
    case ASSISTED_TAB.benefits:
      return has(AssistedPermissions.benefits);
  }
}

export function isAssistedTab(value: string | null): value is AssistedTab {
  return Object.values(ASSISTED_TAB).includes(value as AssistedTab);
}

export function isAccountSubtab(value: string | null): value is AccountSubtab {
  return Object.values(ACCOUNT_SUBTAB).includes(value as AccountSubtab);
}
