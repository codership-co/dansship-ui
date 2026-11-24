/** Participant types and signups of an event (ADR-064, events redesign). Mirrors polership-api participation_schema.py. */

/** "¿Quién se inscribe?": one entry per kind; the UI registries key on these. */
export type RegistrationOptionKind = 'single' | 'pair' | 'group' | 'multi_ticket' | 'group_booking';
export type PricingModelKind = 'per_person' | 'package';
/** Whose account a fee condition is checked on (lowest applicable fee wins). */
export type ConditionSubject = 'holder' | 'each_person';
export type DueAnchorKind = 'fixed_date' | 'at_signup' | 'event_day' | 'days_before_event';
export type PayLaterAnchor = 'after_signup' | 'before_event';
export type ParticipantNoticeKind =
  | 'signup_approved'
  | 'signup_not_approved'
  | 'group_member_added'
  | 'entry_pass'
  | 'pending_payment'
  | 'installment_reminder';
export type ParticipantContributionModel = 'free' | 'money' | 'in_kind' | 'money_and_in_kind';
export type EventFormFieldKind =
  | 'short_text'
  | 'long_text'
  | 'link'
  | 'choice'
  | 'multi_choice'
  | 'checkbox'
  | 'people'
  /** A section title (Google Forms style): its `help_text` is the description. */
  | 'section';
export type EventSignupStatus =
  | 'in_review'
  | 'approved'
  | 'not_approved'
  | 'pending_payment'
  | 'confirmed'
  | 'payment_rejected'
  | 'expired';
export type ParticipantTypeState = 'open' | 'closed' | 'sold_out';
export type PeopleKind = 'all' | 'holders' | 'members' | 'tickets' | 'refund_due';
export type PeopleStatusGroup = 'review' | 'approved' | 'not_approved';

export interface FieldVisibleWhen {
  field_key: string;
  equals: string;
}

export interface ParticipantFieldOptions {
  choices?: Array<string>;
  max_length?: number;
  with_note?: boolean;
  max_people?: number;
}

export interface ParticipantField {
  key: string;
  label: string;
  kind: EventFormFieldKind;
  required: boolean;
  options: ParticipantFieldOptions;
  /** Help under the question, or a section's description. */
  help_text?: string | null;
  visible_when?: FieldVisibleWhen | null;
  admin_editable_copy?: boolean;
  show_in_admin_list?: boolean;
}

export interface ParticipantFee {
  id?: string | null;
  label: string;
  condition_type: string | null;
  condition_params?: Record<string, unknown>;
  price: string | number;
}

export interface DonationType {
  id?: string | null;
  label: string;
}

export interface ParticipantTermsVersion {
  id: string;
  version: number;
  title: string;
  file_url: string | null;
  created_at: string;
  created_by_name?: string | null;
}

/** Same shape as the Black Friday PromotionTermsPreview. */
export interface ParticipantTermsPreview {
  version_id: string;
  version: number;
  title: string;
  file_url: string;
}

/** One way of signing up. Settings depend on `kind`; `label` is the answer in "¿Cómo te inscribes?". */
export interface RegistrationOption {
  kind: RegistrationOptionKind;
  label?: string | null;
  min_people?: number | null;
  max_people?: number | null;
  max_members?: number | null;
  members_required?: boolean | null;
  max_tickets?: number | null;
}

/** "Cómo se ve". Empty or null = the UI default copy. */
export interface CardCopy {
  button_text?: string | null;
  title?: string | null;
  text?: string | null;
  closing_message?: string | null;
}

export interface ParticipantPackage {
  id?: string | null;
  name: string;
  base_price: string | number;
  included_people: number;
  additional_person_price: string | number;
}

export interface ConditionDiscount {
  id?: string | null;
  label: string;
  condition_type: string;
  condition_params?: Record<string, unknown>;
  percent: string | number;
}

export interface DueAnchor {
  anchor: DueAnchorKind;
  /** `fixed_date`: YYYY-MM-DD (Bogotá). */
  date?: string | null;
  /** `days_before_event`: 0–365. */
  days?: number | null;
}

export interface PaymentLineAmount {
  fee_id: string;
  amount: string | number;
}

/** One installment: a percent of the total, or an amount per fee. */
export interface PaymentLine {
  sequence?: number;
  percent?: string | number | null;
  amounts?: Array<PaymentLineAmount>;
  due: DueAnchor;
}

/** How long an admin "paga después" enrollment holds its place unpaid; null = until the event starts. */
export interface PayLaterDeadline {
  anchor: PayLaterAnchor;
  days: number;
}

export interface EmailSettings {
  /** null = every available notice. */
  enabled: Array<ParticipantNoticeKind> | null;
  extra_message: string | null;
}

/** Body of `PUT /admin/events/{id}/participant-types/{type_id}`. */
export interface ParticipantTypeUpsert {
  name: string;
  registration_options: Array<RegistrationOption>;
  card_copy: CardCopy;
  requires_account: boolean;
  requires_approval: boolean;
  contribution_model: ParticipantContributionModel;
  counts_toward_capacity: boolean;
  quota: number | null;
  condition_subject: ConditionSubject;
  minors_allowed: boolean;
  minor_max_age: number | null;
  minors_per_adult_max: number | null;
  minors_count_toward_capacity: boolean;
  minor_price: string | number | null;
  closes_at: string | null;
  issues_entry_qr: boolean;
  is_active: boolean;
  fields: Array<ParticipantField>;
  fees: Array<ParticipantFee>;
  pricing_model: PricingModelKind;
  packages: Array<ParticipantPackage>;
  condition_discounts: Array<ConditionDiscount>;
  /** Empty = single payment. */
  payment_plan: Array<PaymentLine>;
  installment_reminder_days: Array<number> | null;
  pay_later_deadline: PayLaterDeadline | null;
  email_settings: EmailSettings | null;
  donation_types: Array<DonationType>;
}

export interface ParticipantTypeAdmin extends ParticipantTypeUpsert {
  id: string;
  event_id: string;
  position: number;
  /** Notices this configuration can send (what the editor offers). */
  available_notices: Array<ParticipantNoticeKind>;
  signup_count: number;
  people_count: number;
}

export type ParticipantTypePreset = 'general' | 'artists' | 'guests';

export interface ParticipantMinorsRules {
  allowed: boolean;
  max_age: number | null;
  per_adult_max: number | null;
  price?: string | number | null;
}

/** A package as the public sees it (never which discount applies). */
export interface PublicPackage {
  id: string;
  name: string;
  base_price: string | number;
  included_people: number;
  additional_person_price: string | number;
}

export interface LandingParticipantType {
  id: string;
  name: string;
  registration_options: Array<RegistrationOption>;
  card_copy: CardCopy;
  state: ParticipantTypeState;
  closes_at: string | null;
  requires_account: boolean;
  /** Name and price only, never who qualifies. */
  fees: Array<{ label: string; price: string | number }>;
  minors: ParticipantMinorsRules;
  pricing_model: PricingModelKind;
  packages: Array<PublicPackage>;
  my_signup_id: string | null;
}

export interface LandingParticipation {
  types: Array<LandingParticipantType>;
  /** The event's terms, one PDF for every type; null = no checkbox. */
  terms: ParticipantTermsPreview | null;
  remaining: number;
  capacity: number;
}

export interface FamilyMinorOption {
  user_id: string;
  full_name: string;
  age: number | null;
}

export interface ParticipantForm {
  participant_type_id: string;
  participant_type_name: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  starts_at: string;
  place_label: string | null;
  state: 'open' | 'closed';
  closes_at: string | null;
  signer_name: string;
  fields: Array<ParticipantField>;
  takes_donations: boolean;
  donation_types: Array<{ id: string; label: string }>;
  minors: ParticipantMinorsRules;
  family_minors: Array<FamilyMinorOption>;
  registration_options: Array<RegistrationOption>;
  terms: ParticipantTermsPreview | null;
  my_signup_id: string | null;
}

export interface LinkAnswer {
  url: string;
  note?: string | null;
}

export type SignupAnswerValue = string | boolean | Array<string> | LinkAnswer | null;

export interface SignupMemberPayload {
  full_name: string;
  is_minor: boolean;
  email?: string | null;
  phone?: string | null;
  family_minor_user_id?: string | null;
}

export interface SignupSubmitPayload {
  answers: Record<string, SignupAnswerValue>;
  members: Array<SignupMemberPayload>;
  donation_type_ids: Array<string>;
  accepted_terms: boolean;
  terms_version_id: string | null;
  registration_option?: RegistrationOptionKind | null;
  partner_email?: string | null;
  tickets?: Array<TicketInputPayload>;
}

export interface SignupPerson {
  id: string;
  full_name: string;
  role: 'holder' | 'member' | 'ticket';
  is_minor: boolean;
  email: string | null;
  phone: string | null;
  age: number | null;
  family_minor_user_id: string | null;
}

export interface SignupAnswerView {
  key: string;
  label: string;
  kind: EventFormFieldKind;
  value: SignupAnswerValue;
}

export interface MySignup {
  id: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  starts_at: string;
  place_label: string | null;
  participant_type_id: string;
  participant_type_name: string;
  registration_option?: RegistrationOptionKind;
  status: EventSignupStatus;
  answers: Array<SignupAnswerView>;
  raw_answers: Record<string, SignupAnswerValue>;
  members: Array<SignupPerson>;
  donation_type_ids: Array<string>;
  donations: Array<string>;
  closes_at: string | null;
  editable: boolean;
  submitted_at: string;
}

export interface AdminSignupDetail extends MySignup {
  signer_name: string;
  signer_email: string | null;
  signer_phone: string | null;
  admin_copies: Record<string, string>;
  admin_note: string | null;
  donation_received: boolean;
  donation_received_at: string | null;
  reviewed_at: string | null;
  edited_at: string | null;
  terms_version: number | null;
  editable_copy_fields: Array<string>;
  /** How the current terms were accepted ("admin" = recorded on "+ Inscribir persona"). */
  terms_acceptance?: SignupTermsAcceptance | null;
  /** A paid signup not approved keeps its approved payment; the refund happens outside the platform. */
  approved_amount?: string | number;
  refund_due?: boolean;
  refunded_outside_at?: string | null;
  refunded_outside_by_name?: string | null;
}

export type TermsSource = 'self' | 'admin';

export interface SignupTermsAcceptance {
  version: number;
  accepted_at: string;
  source: TermsSource;
  recorded_by_name: string | null;
}

export interface AdminSignupUpdatePayload {
  admin_copies?: Record<string, string>;
  admin_note?: string;
}

export type InstallmentViewStatus = 'pending' | 'overdue' | 'in_review' | 'paid';

export interface SignupInstallmentView {
  sequence: number;
  due_date: string;
  amount: string | number;
  status: InstallmentViewStatus;
}

/** What "Pagar" would open now. */
export type ParticipationPayAction = 'none' | 'pay' | 'pay_deposit';

export interface MyParticipationRow {
  /** `registration` = a legacy event (served by `/events/registrations/me` in the UI until the API closes gap G3). */
  kind: 'signup' | 'ticket' | 'registration';
  repayable: boolean;
  id: string;
  signup_id: string | null;
  event_id: string;
  event_name: string;
  event_slug: string;
  starts_at: string;
  ends_at: string;
  place_label: string | null;
  participant_type_name: string;
  status: EventSignupStatus;
  holder_name: string | null;
  minors: Array<string>;
  editable: boolean;
  purchase_id: string | null;
  payment_intent_id: string | null;
  payment_status: string | null;
  /** Part 2: the person this row's QR belongs to and its entry state. */
  person_id: string | null;
  has_entry_pass: boolean;
  entered_at: string | null;
  is_attendee: boolean;
  issues_entry_qr: boolean;
  installments?: Array<SignupInstallmentView>;
  pay_action?: ParticipationPayAction;
}

export interface PeopleFilterChip {
  kind: PeopleKind;
  participant_type_id: string | null;
  participant_type_name: string | null;
  count: number;
}

export interface PeopleColumn {
  key: string;
  label: string;
}

export interface ParticipationPersonRow {
  person_id: string;
  signup_id: string;
  participant_type_id: string;
  participant_type_name: string;
  role: 'holder' | 'member' | 'ticket';
  is_minor: boolean;
  full_name: string;
  email: string | null;
  phone: string | null;
  age: number | null;
  status: EventSignupStatus;
  signup_title: string | null;
  leader_name: string | null;
  attached_to_name: string | null;
  answers: Record<string, string>;
  donations: Array<string>;
  donation_received: boolean;
  member_count: number;
  minor_count: number;
  buyer_name: string | null;
  fee_label: string | null;
  amount: string | number | null;
  payment_intent_id: string | null;
  payment_status: string | null;
  entered_at: string | null;
  validated_by_name: string | null;
  has_entry_pass: boolean;
  /** Part 3: the adult a minor enters with; for leaders, the text read aloud. */
  attached_to_person_id: string | null;
  announcement_copy: string | null;
  /** Not approved with an approved payment, not yet marked as refunded outside the platform. */
  refund_due?: boolean;
  refunded_outside?: boolean;
  terms_source?: TermsSource | null;
}

export interface ParticipationPeople {
  filters: Array<PeopleFilterChip>;
  columns: Array<PeopleColumn>;
  rows: Array<ParticipationPersonRow>;
}

export interface ParticipationPeopleQuery {
  kind?: PeopleKind;
  participant_type_id?: string | null;
  status?: PeopleStatusGroup | null;
  q?: string | null;
  entered?: boolean | null;
}

export interface ParticipationSummary {
  capacity: { capacity: number; held: number; free: number };
  registrations: Array<{
    participant_type_id: string;
    name: string;
    in_review: number;
    approved: number;
    not_approved: number;
    total: number;
  }>;
  expected_people: { total: number; tickets: number; ticket_minors: number; performers: number; members: number };
  revenue: {
    approved: string | number;
    in_review: string | number;
    total: string | number;
    /** Approved tickets only (snapshotted price). */
    by_fee: Array<{ label: string; amount: string | number; count: number; total: string | number }>;
    in_review_by_fee: Array<{ label: string; amount: string | number; count: number; total: string | number }>;
  };
  donations: Array<{ donation_type_id: string; label: string; committed: number; received: number }>;
  /** Part 2: null while no type of the event issues entry QRs. */
  attendance: {
    guests: { entered: number; expected: number };
    minors: { entered: number; expected: number };
    artists: { entered: number; expected: number };
  } | null;
  /** Part 3: closing numbers, counts only. */
  closing: {
    tickets_approved: number;
    ticket_minors_approved: number;
    entered_by_scan: number;
    entered_by_manual: number;
    minors_entered: number;
    no_show_tickets: number;
    artists_approved: number;
    artists_presented: number;
    members_approved: number;
    members_presented: number;
    /** No-shows are final only once the entry window has closed. */
    entry_closed: boolean;
  } | null;
  /** Not-approved paid signups: money to return outside the platform. */
  refunds?: RefundSummary;
}

export interface RefundSummary {
  due_count: number;
  due_amount: string | number;
  refunded_count: number;
  refunded_amount: string | number;
}

// ── Tickets (Slice B) ─────────────────────────────────────────────────

export interface TicketInputPayload {
  full_name: string;
  is_minor: boolean;
  email?: string | null;
  attach_to_index?: number | null;
  family_minor_user_id?: string | null;
}

export interface TicketQuotePayload {
  participant_type_id: string;
  tickets: Array<TicketInputPayload>;
}

export interface TicketPurchasePayload extends TicketQuotePayload {
  payment_method_type: string;
  accepted_terms: boolean;
  terms_version_id: string | null;
}

/** One ticket and its price. The API never says why a price applies. */
export interface TicketLine {
  index: number;
  full_name: string;
  is_minor: boolean;
  email: string | null;
  attach_to_index: number | null;
  price: number;
}

/** Totals of a ticket purchase, already as numbers. */
export interface TicketTotals {
  final_price: number;
  base_amount: number;
  tax_amount: number;
  wallet_amount_applied: number;
  amount_to_charge: number;
}

export interface TicketQuote {
  tickets: Array<TicketLine>;
  totals: TicketTotals;
}

export interface TicketPurchaseResult {
  purchase_id: string;
  signup_id: string;
  payment_intent_id: string;
  tickets: Array<TicketLine>;
  total: number;
  amount_to_charge: number;
  payment_qr_url: string | null;
}

export interface TicketPurchaseDetail {
  purchase_id: string;
  signup_id: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  participant_type_id: string;
  status: EventSignupStatus;
  tickets: Array<TicketLine>;
  totals: TicketTotals;
  payment_intent_id: string | null;
  payment_status: string | null;
  repayable: boolean;
  terms: ParticipantTermsPreview | null;
}

// ── One signup flow (any participant type) ────────────────────────────

/** Body of `POST /events/by-slug/{slug}/signups[/quote]`. People come from the chosen option. */
export interface SignupApplication {
  participant_type_id: string;
  registration_option?: RegistrationOptionKind | null;
  answers: Record<string, SignupAnswerValue>;
  members: Array<SignupMemberPayload>;
  tickets: Array<TicketInputPayload>;
  partner_email?: string | null;
  package_id?: string | null;
  people_count?: number | null;
  donation_type_ids: Array<string>;
  accepted_terms: boolean;
  terms_version_id: string | null;
  /** Required to submit a paid type (not to quote). */
  payment_method_type?: string | null;
}

/** Quote of a signup, mapped to numbers. `totals` is null for free types. */
export interface SignupQuote {
  charges_money: boolean;
  lines: Array<TicketLine>;
  total: number;
  totals: TicketTotals | null;
}

export interface SignupApplicationResult {
  signup_id: string;
  status: EventSignupStatus;
  registration_option: RegistrationOptionKind;
  lines: Array<TicketLine>;
  total: number;
  purchase_id: string | null;
  payment_intent_id: string | null;
  amount_to_charge: number | null;
  payment_qr_url: string | null;
}

/** A payment opened from Mis reservas ("Pagar", "Pagar anticipo", "Pagar siguiente cuota"). */
export interface SignupPaymentResult {
  signup_id: string;
  purchase_id: string;
  payment_intent_id: string;
  sequences: Array<number>;
  amount_to_charge: number;
  payment_qr_url: string | null;
}

// ── Admin enrollment ("+ Inscribir persona") ──────────────────────────

export type EnrollmentPayment = 'paid' | 'pay_later';

export interface AdminEnrollmentPayload {
  participant_type_id: string;
  user_id: string;
  registration_option?: RegistrationOptionKind | null;
  answers?: Record<string, SignupAnswerValue>;
  members?: Array<SignupMemberPayload>;
  tickets?: Array<TicketInputPayload>;
  partner_email?: string | null;
  package_id?: string | null;
  people_count?: number | null;
  donation_type_ids?: Array<string>;
  /** Paid types only; omitted for free types. */
  payment?: EnrollmentPayment | null;
  proof_key?: string | null;
  idempotency_key?: string | null;
  /** When the event has a terms PDF; default true. */
  record_terms_acceptance?: boolean;
}

/** Total, discount, deposit (lines due now) and balance, mapped to numbers. */
export interface AdminEnrollmentQuote {
  charges_money: boolean;
  total: number;
  discount_percent: number | null;
  deposit: number;
  balance: number;
  lines: Array<TicketLine>;
}

export interface AdminEnrollmentResult {
  signup_id: string;
  user_id: string | null;
  status: EventSignupStatus;
  purchase_id: string | null;
  payment_intent_id: string | null;
  pay_by: string | null;
}
