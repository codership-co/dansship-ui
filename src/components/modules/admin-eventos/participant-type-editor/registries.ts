import type {
  DueAnchorKind,
  ParticipantNoticeKind,
  PayLaterAnchor,
  PricingModelKind,
  RegistrationOption,
  RegistrationOptionKind,
} from '@core/api';

/**
 * UI registries of the participant-type editor. They mirror the backend registries: a new backend option
 * is one entry here, never a new conditional in a section.
 */

export interface OptionSetting {
  key: 'max_members' | 'max_tickets' | 'min_people' | 'max_people' | 'members_required';
  kind: 'number' | 'switch';
  labelKey: string;
  min?: number;
  max?: number;
  /** The number may be left empty ("Sin límite"). */
  optional?: boolean;
}

export interface RegistrationOptionEditor {
  labelKey: string;
  tooltipKey: string;
  defaults: Partial<RegistrationOption>;
  settings: Array<OptionSetting>;
  /** Each adult gives name and email (the form shows them as fixed rows). */
  asksTicketPeople?: boolean;
  /** Only priced by packages (`group_booking`, documented API invariant). */
  needsPackages?: boolean;
}

const OPTION_KEY = 'eventos:participation.registrationOptions';
const SETTING_KEY = 'eventos:participation.optionSettings';

export const REGISTRATION_OPTION_EDITORS: Record<RegistrationOptionKind, RegistrationOptionEditor> = {
  single: {
    labelKey: `${OPTION_KEY}.single.label`,
    tooltipKey: `${OPTION_KEY}.single.tooltip`,
    defaults: {},
    settings: [],
  },
  pair: { labelKey: `${OPTION_KEY}.pair.label`, tooltipKey: `${OPTION_KEY}.pair.tooltip`, defaults: {}, settings: [] },
  group: {
    labelKey: `${OPTION_KEY}.group.label`,
    tooltipKey: `${OPTION_KEY}.group.tooltip`,
    defaults: { max_members: 30, members_required: true },
    settings: [
      { key: 'max_members', kind: 'number', labelKey: `${SETTING_KEY}.maxMembers`, min: 1, max: 100, optional: true },
      { key: 'members_required', kind: 'switch', labelKey: `${SETTING_KEY}.membersRequired` },
    ],
  },
  multi_ticket: {
    labelKey: `${OPTION_KEY}.multi_ticket.label`,
    tooltipKey: `${OPTION_KEY}.multi_ticket.tooltip`,
    defaults: { max_tickets: 10 },
    settings: [
      { key: 'max_tickets', kind: 'number', labelKey: `${SETTING_KEY}.maxTickets`, min: 1, max: 50, optional: true },
    ],
    asksTicketPeople: true,
  },
  group_booking: {
    labelKey: `${OPTION_KEY}.group_booking.label`,
    tooltipKey: `${OPTION_KEY}.group_booking.tooltip`,
    defaults: { min_people: 1, max_people: 20 },
    settings: [
      { key: 'min_people', kind: 'number', labelKey: `${SETTING_KEY}.minPeople`, min: 1, max: 200 },
      { key: 'max_people', kind: 'number', labelKey: `${SETTING_KEY}.maxPeople`, min: 1, max: 200 },
    ],
    needsPackages: true,
  },
};

export const REGISTRATION_OPTION_KINDS = Object.keys(REGISTRATION_OPTION_EDITORS) as Array<RegistrationOptionKind>;

export interface PricingModelEditor {
  labelKey: string;
  /** Installments may be amounts per fee (per-person types only). */
  allowsAmountPlan: boolean;
}

export const PRICING_MODEL_EDITORS: Record<PricingModelKind, PricingModelEditor> = {
  per_person: { labelKey: 'eventos:participation.pricingModels.per_person', allowsAmountPlan: true },
  package: { labelKey: 'eventos:participation.pricingModels.package', allowsAmountPlan: false },
};

export const PRICING_MODEL_KINDS = Object.keys(PRICING_MODEL_EDITORS) as Array<PricingModelKind>;

export interface DueAnchorEditor {
  labelKey: string;
  /** The parameter the anchor needs. */
  param?: 'date' | 'days';
}

export const DUE_ANCHOR_EDITORS: Record<DueAnchorKind, DueAnchorEditor> = {
  fixed_date: { labelKey: 'eventos:participation.dueAnchors.fixed_date', param: 'date' },
  at_signup: { labelKey: 'eventos:participation.dueAnchors.at_signup' },
  event_day: { labelKey: 'eventos:participation.dueAnchors.event_day' },
  days_before_event: { labelKey: 'eventos:participation.dueAnchors.days_before_event', param: 'days' },
};

export const DUE_ANCHOR_KINDS = Object.keys(DUE_ANCHOR_EDITORS) as Array<DueAnchorKind>;

export const PAY_LATER_ANCHORS: Array<PayLaterAnchor | 'none'> = ['none', 'after_signup', 'before_event'];

export interface EmailNoticeLabel {
  labelKey: string;
  tooltipKey: string;
}

/** Labels of the notices the API offers per type (`available_notices`). */
export const EMAIL_NOTICE_LABELS: Record<ParticipantNoticeKind, EmailNoticeLabel> = {
  signup_approved: {
    labelKey: 'eventos:participation.notices.signup_approved.label',
    tooltipKey: 'eventos:participation.notices.signup_approved.tooltip',
  },
  signup_not_approved: {
    labelKey: 'eventos:participation.notices.signup_not_approved.label',
    tooltipKey: 'eventos:participation.notices.signup_not_approved.tooltip',
  },
  group_member_added: {
    labelKey: 'eventos:participation.notices.group_member_added.label',
    tooltipKey: 'eventos:participation.notices.group_member_added.tooltip',
  },
  entry_pass: {
    labelKey: 'eventos:participation.notices.entry_pass.label',
    tooltipKey: 'eventos:participation.notices.entry_pass.tooltip',
  },
  pending_payment: {
    labelKey: 'eventos:participation.notices.pending_payment.label',
    tooltipKey: 'eventos:participation.notices.pending_payment.tooltip',
  },
  installment_reminder: {
    labelKey: 'eventos:participation.notices.installment_reminder.label',
    tooltipKey: 'eventos:participation.notices.installment_reminder.tooltip',
  },
};
