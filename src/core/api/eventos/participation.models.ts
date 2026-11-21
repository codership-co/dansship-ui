/** Participant types and signups of an event (ADR-064). Mirrors polership-api participation_schema.py. */

export type ParticipantRegistrationMode = 'single' | 'single_or_group' | 'multi_ticket';
export type ParticipantAccessMode = 'public' | 'link';
export type ParticipantContributionModel = 'free' | 'money' | 'in_kind' | 'money_and_in_kind';
export type EventFormFieldKind =
  | 'short_text'
  | 'long_text'
  | 'link'
  | 'choice'
  | 'multi_choice'
  | 'checkbox'
  | 'people';
export type EventSignupStatus =
  | 'in_review'
  | 'approved'
  | 'not_approved'
  | 'pending_payment'
  | 'confirmed'
  | 'payment_rejected'
  | 'expired';
export type ParticipantTypeState = 'open' | 'closed' | 'sold_out';
export type PeopleKind = 'all' | 'holders' | 'members' | 'tickets';
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

export interface ParticipantTypeConfig {
  name: string;
  registration_mode: ParticipantRegistrationMode;
  access_mode: ParticipantAccessMode;
  requires_account: boolean;
  requires_approval: boolean;
  contribution_model: ParticipantContributionModel;
  counts_toward_capacity: boolean;
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
  donation_types: Array<DonationType>;
}

export interface ParticipantTypeAdmin extends ParticipantTypeConfig {
  id: string;
  event_id: string;
  position: number;
  access_token: string | null;
  terms: ParticipantTermsVersion | null;
  signup_count: number;
  people_count: number;
}

export type ParticipantTypePreset = 'artists' | 'guests';

export interface ParticipantMinorsRules {
  allowed: boolean;
  max_age: number | null;
  per_adult_max: number | null;
  price?: string | number | null;
}

export interface LandingParticipantType {
  id: string;
  name: string;
  registration_mode: ParticipantRegistrationMode;
  state: ParticipantTypeState;
  closes_at: string | null;
  requires_account: boolean;
  fees: Array<{ label: string; price: string | number }>;
  minors: ParticipantMinorsRules;
  terms: ParticipantTermsPreview | null;
  my_signup_id: string | null;
}

export interface LandingParticipation {
  types: Array<LandingParticipantType>;
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
  access_token?: string | null;
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
}

export interface AdminSignupUpdatePayload {
  admin_copies?: Record<string, string>;
  admin_note?: string;
}

export interface MyParticipationRow {
  kind: 'signup' | 'ticket';
  repayable: boolean;
  id: string;
  signup_id: string;
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
    by_fee: Array<{ label: string; amount: string | number; count: number; total: string | number }>;
  };
  donations: Array<{ donation_type_id: string; label: string; committed: number; received: number }>;
  /** Part 2: null while no type of the event issues entry QRs. */
  attendance: {
    guests: { entered: number; expected: number };
    minors: { entered: number; expected: number };
    artists: { entered: number; expected: number };
  } | null;
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
  access_token?: string | null;
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
