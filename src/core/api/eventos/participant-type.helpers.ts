import { DansshipAPIError } from '../dansship.error';
import { toNumber } from '../payments/payments.helpers';

import { bogotaLocalToIso, isoToBogotaLocal } from './participation.helpers';

import type {
  CardCopy,
  ConditionDiscount,
  ConditionSubject,
  DonationType,
  DueAnchor,
  LandingParticipantType,
  ParticipantContributionModel,
  ParticipantFee,
  ParticipantField,
  ParticipantNoticeKind,
  ParticipantPackage,
  ParticipantTypeAdmin,
  ParticipantTypeUpsert,
  PayLaterAnchor,
  PricingModelKind,
  RegistrationOption,
} from './participation.models';

/** Inputs keep what the admin typed; numbers become numbers only in `toParticipantTypeUpsert`. */
export type NumberInput = string | number | null;

export interface PaymentLineValues {
  percent: NumberInput;
  /** fee id → amount (amount lines, per-person types only). */
  amounts: Record<string, NumberInput>;
  due: DueAnchor;
}

/** Values of the generic participant-type editor (react-hook-form). */
export interface ParticipantTypeFormValues {
  name: string;
  registration_options: Array<RegistrationOption>;
  /** `simple` = "Registro simple" (`requires_account: false`). */
  account_mode: 'full' | 'simple';
  requires_approval: boolean;
  contribution_model: ParticipantContributionModel;
  pricing_model: PricingModelKind;
  condition_subject: ConditionSubject;
  fees: Array<ParticipantFee>;
  packages: Array<ParticipantPackage>;
  condition_discounts: Array<ConditionDiscount>;
  payment_mode: 'single' | 'installments';
  plan_unit: 'percent' | 'amount';
  payment_plan: Array<PaymentLineValues>;
  installment_reminder_days: Array<number>;
  pay_later_anchor: PayLaterAnchor | 'none';
  pay_later_days: NumberInput;
  donation_types: Array<DonationType>;
  fields: Array<ParticipantField>;
  minors_allowed: boolean;
  minor_max_age: NumberInput;
  minors_per_adult_max: NumberInput;
  minor_price: NumberInput;
  minors_count_toward_capacity: boolean;
  counts_toward_capacity: boolean;
  quota: NumberInput;
  closes_at_local: string;
  /** «Se pueden cambiar los datos hasta»: days before the event; empty = until the close date. */
  edit_days_before_event: NumberInput;
  issues_entry_qr: boolean;
  is_active: boolean;
  card_copy: Required<{ [K in keyof CardCopy]: string }>;
  /** Notices switched on; every available notice when the API says `enabled: null`. */
  email_enabled: Array<ParticipantNoticeKind>;
  email_extra_message: string;
}

export function chargesMoney(model: ParticipantContributionModel): boolean {
  return model === 'money' || model === 'money_and_in_kind';
}

export function takesDonations(model: ParticipantContributionModel): boolean {
  return model === 'in_kind' || model === 'money_and_in_kind';
}

function numberOrNull(value: NumberInput | undefined): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = toNumber(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function textOrNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();

  return trimmed ? trimmed : null;
}

function planUnitOf(type: ParticipantTypeAdmin): 'percent' | 'amount' {
  const first = type.payment_plan[0];

  return first && (first.amounts?.length ?? 0) > 0 ? 'amount' : 'percent';
}

/** API type → editor values. */
export function participantTypeFormValues(type: ParticipantTypeAdmin): ParticipantTypeFormValues {
  return {
    name: type.name,
    registration_options: type.registration_options.map(option => ({ ...option })),
    account_mode: type.requires_account ? 'full' : 'simple',
    requires_approval: type.requires_approval,
    contribution_model: type.contribution_model,
    pricing_model: type.pricing_model ?? 'per_person',
    condition_subject: type.condition_subject ?? 'holder',
    fees: type.fees.map(fee => ({ ...fee })),
    packages: (type.packages ?? []).map(item => ({ ...item })),
    condition_discounts: (type.condition_discounts ?? []).map(item => ({ ...item })),
    payment_mode: type.payment_plan.length > 0 ? 'installments' : 'single',
    plan_unit: planUnitOf(type),
    payment_plan: type.payment_plan.map(line => ({
      percent: line.percent ?? null,
      amounts: Object.fromEntries((line.amounts ?? []).map(item => [item.fee_id, item.amount])),
      due: { ...line.due },
    })),
    installment_reminder_days: [...(type.installment_reminder_days ?? [])],
    pay_later_anchor: type.pay_later_deadline?.anchor ?? 'none',
    pay_later_days: type.pay_later_deadline?.days ?? null,
    donation_types: type.donation_types.map(item => ({ ...item })),
    fields: type.fields.map(field => ({ ...field, options: { ...field.options } })),
    minors_allowed: type.minors_allowed,
    minor_max_age: type.minor_max_age,
    minors_per_adult_max: type.minors_per_adult_max,
    minor_price: type.minor_price,
    minors_count_toward_capacity: type.minors_count_toward_capacity,
    counts_toward_capacity: type.counts_toward_capacity,
    quota: type.quota ?? null,
    closes_at_local: isoToBogotaLocal(type.closes_at),
    edit_days_before_event: type.edit_days_before_event ?? null,
    issues_entry_qr: type.issues_entry_qr,
    is_active: type.is_active,
    card_copy: {
      button_text: type.card_copy?.button_text ?? '',
      title: type.card_copy?.title ?? '',
      text: type.card_copy?.text ?? '',
      closing_message: type.card_copy?.closing_message ?? '',
    },
    email_enabled: type.email_settings?.enabled ?? [...(type.available_notices ?? [])],
    email_extra_message: type.email_settings?.extra_message ?? '',
  };
}

function cleanOption(option: RegistrationOption): RegistrationOption {
  const clean: RegistrationOption = { kind: option.kind, label: textOrNull(option.label) };

  for (const key of ['min_people', 'max_people', 'max_members', 'max_tickets'] as const) {
    const value = numberOrNull(option[key] as NumberInput | undefined);

    if (value !== null) clean[key] = value;
  }

  if (option.members_required !== undefined && option.members_required !== null) {
    clean.members_required = option.members_required;
  }

  return clean;
}

function cleanDue(due: DueAnchor): DueAnchor {
  if (due.anchor === 'fixed_date') return { anchor: due.anchor, date: due.date || null };

  if (due.anchor === 'days_before_event') return { anchor: due.anchor, days: numberOrNull(due.days ?? null) };

  return { anchor: due.anchor };
}

/** Editor values → `PUT …/participant-types/{id}` body. Money settings are dropped when the type takes none. */
export function toParticipantTypeUpsert(
  values: ParticipantTypeFormValues,
  availableNotices: Array<ParticipantNoticeKind>,
): ParticipantTypeUpsert {
  const money = chargesMoney(values.contribution_model);
  const perPerson = values.pricing_model === 'per_person';
  const installments = money && values.payment_mode === 'installments';
  const byAmount = installments && perPerson && values.plan_unit === 'amount';
  const enabled = availableNotices.filter(kind => values.email_enabled.includes(kind));
  const allEnabled = enabled.length === availableNotices.length;
  const extraMessage = textOrNull(values.email_extra_message);

  return {
    name: values.name.trim(),
    registration_options: values.registration_options.map(cleanOption),
    card_copy: {
      button_text: textOrNull(values.card_copy.button_text),
      title: textOrNull(values.card_copy.title),
      text: textOrNull(values.card_copy.text),
      closing_message: textOrNull(values.card_copy.closing_message),
    },
    requires_account: values.account_mode === 'full',
    requires_approval: values.requires_approval,
    contribution_model: values.contribution_model,
    counts_toward_capacity: values.counts_toward_capacity,
    quota: values.counts_toward_capacity ? numberOrNull(values.quota) : null,
    condition_subject: values.condition_subject,
    minors_allowed: values.minors_allowed,
    minor_max_age: values.minors_allowed ? numberOrNull(values.minor_max_age) : null,
    minors_per_adult_max: values.minors_allowed ? numberOrNull(values.minors_per_adult_max) : null,
    minors_count_toward_capacity: values.minors_allowed && values.minors_count_toward_capacity,
    minor_price: values.minors_allowed && money ? numberOrNull(values.minor_price) : null,
    closes_at: bogotaLocalToIso(values.closes_at_local),
    edit_days_before_event: numberOrNull(values.edit_days_before_event),
    issues_entry_qr: values.issues_entry_qr,
    is_active: values.is_active,
    fields: values.fields,
    fees: money && perPerson ? values.fees : [],
    pricing_model: money ? values.pricing_model : 'per_person',
    packages: money && !perPerson ? values.packages : [],
    condition_discounts: money && !perPerson ? values.condition_discounts : [],
    payment_plan: installments
      ? values.payment_plan.map(line => ({
          percent: byAmount ? null : numberOrNull(line.percent),
          amounts: byAmount
            ? Object.entries(line.amounts).map(([feeId, amount]) => ({
                fee_id: feeId,
                amount: numberOrNull(amount) ?? 0,
              }))
            : [],
          due: cleanDue(line.due),
        }))
      : [],
    installment_reminder_days:
      installments && values.installment_reminder_days.length > 0 ? values.installment_reminder_days : null,
    pay_later_deadline:
      money && values.pay_later_anchor !== 'none'
        ? { anchor: values.pay_later_anchor, days: numberOrNull(values.pay_later_days) ?? 0 }
        : null,
    email_settings:
      allEnabled && !extraMessage ? null : { enabled: allEnabled ? null : enabled, extra_message: extraMessage },
    donation_types: takesDonations(values.contribution_model) ? values.donation_types : [],
  };
}

/** Error codes of the editor that name a whole area rather than `details.field`. */
const CODE_PATHS: Record<string, string> = {
  EVENT_REGISTRATION_OPTION_INVALID: 'registration_options',
  EVENT_REGISTRATION_OPTION_IN_USE: 'registration_options',
  EVENT_PAYMENT_PLAN_INVALID: 'payment_plan',
  EVENT_PACKAGE_NOT_CONFIGURED: 'packages',
  EVENT_FEE_NOT_CONFIGURED: 'fees',
};

/** Fields the API names in `details.field` that live under another editor path. */
const FIELD_PATHS: Record<string, string> = {
  minor_max_age: 'minor_max_age',
  minor_price: 'minor_price',
  closes_at: 'closes_at_local',
  email_settings: 'email_extra_message',
  pay_later_deadline: 'pay_later_days',
};

/**
 * The editor path a save error points to, so the form can mark that field.
 * `details.field` names the field; card copy also names its `key`. Null when the error names no field.
 */
export function editorErrorPath(error: unknown): string | null {
  if (!(error instanceof DansshipAPIError)) {
    return null;
  }

  const code = error.body.error_code;
  const raw: unknown = error.body.details;
  const details = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const field = typeof details.field === 'string' ? details.field : null;

  if (field === 'card_copy' && typeof details.key === 'string') {
    return `card_copy.${details.key}`;
  }

  if (field) {
    return FIELD_PATHS[field] ?? field;
  }

  return CODE_PATHS[code] ?? null;
}

export interface DisplayPriceRow {
  label: string;
  /** null = "Gratis". */
  price: number | null;
  /** Package rows show "desde". */
  from?: boolean;
}

/** What a type's card shows as price: fee names and prices, packages, and the minors row. Never why a price applies. */
export function displayPrice(type: LandingParticipantType, minorsLabel: string): Array<DisplayPriceRow> {
  const rows: Array<DisplayPriceRow> =
    type.pricing_model === 'package'
      ? type.packages.map(item => ({ label: item.name, price: toNumber(item.base_price), from: true }))
      : type.fees.map(fee => ({ label: fee.label, price: toNumber(fee.price) || null }));

  if (type.minors.allowed && rows.length > 0 && type.minors.price !== undefined && type.minors.price !== null) {
    rows.push({ label: minorsLabel, price: toNumber(type.minors.price) || null });
  }

  return rows;
}

/** A type with no fee and no package takes no money. */
export function landingTypeIsFree(type: LandingParticipantType): boolean {
  return type.fees.every(fee => !toNumber(fee.price)) && type.packages.length === 0;
}
