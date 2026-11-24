import type { LandingParticipation } from './participation.models';

export type EventStatus = 'draft' | 'published';
export type EventType = 'taller' | 'clase_especial' | 'recital' | 'showcase' | 'configured';
/** `participant_types`: Información + participant types; `legacy`: the old flat events. Chooses the editor. */
export type EventConfigurationModel = 'legacy' | 'participant_types';
/** Público / Privado; `link_only` survives only on legacy events (read-only, inherited). */
export type EventVisibility = 'public' | 'link_only' | 'invite_only';
export type EventOfferingKind = 'event' | 'combo';
export type EventRegistrationSource = 'direct' | 'combo';
export type EventRegistrationStatus = 'pending_payment' | 'confirmed' | 'expired' | 'rejected' | 'withdrawn';

export interface EventInstallmentAmount {
  tier_position: number | null;
  price_tier_id?: string | null;
  amount: string | number;
}

export interface EventInstallmentDefinition {
  sequence: number;
  due_date: string;
  amounts: Array<EventInstallmentAmount>;
}

export const INSTALLMENT_PROOF_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] as const;

export type InstallmentProofContentType = (typeof INSTALLMENT_PROOF_CONTENT_TYPES)[number];

export interface RegistrationInstallment {
  sequence: number;
  due_date: string;
  amount: string | number;
  status: string;
  payment_intent_id?: string | null;
  registered_by?: string | null;
  registered_by_name?: string | null;
}

export interface InstallmentQuoteLine {
  sequence: number;
  due_date: string;
  amount: string | number;
  status: string;
  selectable: boolean;
}

export interface InstallmentPaymentOption {
  sequences: Array<number>;
  amount: string | number;
  base_amount: string | number;
  tax_amount: string | number;
}

export interface InstallmentQuote {
  registered: boolean;
  registration_id: string | null;
  lines: Array<InstallmentQuoteLine>;
  default_sequences: Array<number>;
  payment_options?: Array<InstallmentPaymentOption>;
}

export interface ManualInstallmentConfirmPayload {
  user_id: string;
  sequences: Array<number>;
  proof_key: string;
  idempotency_key: string;
  /** ISO date the person actually paid, when it differs from today. */
  paid_on?: string;
  note?: string;
}

export interface ManualInstallmentPaymentResult {
  purchase_id: string;
  payment_intent_id: string;
}

export interface EventPriceTierInput {
  condition_type: string;
  condition_params: Record<string, unknown>;
  price: number | string;
}

export interface EventPriceTier {
  id: string;
  position: number;
  condition_type: string;
  condition_params: Record<string, unknown>;
  price: string | number;
}

export interface EventCatalogCard {
  kind: EventOfferingKind;
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  date_label: string;
  starts_at?: string | null;
  instructor_label: string;
  room_label: string;
  price_from: string | number;
  installment_price_from?: string | number | null;
  priced_per_pair: boolean;
  remaining: number;
  capacity: number;
  sold_out: boolean;
  type?: EventType | null;
  type_label?: string | null;
}

export interface LandingPriceRow {
  label: string;
  price: string | number;
  installment_amounts?: Array<string | number>;
}

export interface LandingComponentCard {
  slug: string;
  name: string;
  image_url: string | null;
  date_label: string;
  starts_at?: string | null;
  instructor_label: string;
  room_label: string;
}

export interface InstructorLanding {
  id: string;
  name: string;
  initials: string;
}

export interface EventLanding {
  kind: EventOfferingKind;
  id: string;
  slug: string;
  name: string;
  type?: EventType | null;
  type_label?: string | null;
  description: string | null;
  image_url: string | null;
  requires_partner: boolean;
  simple_registration_enabled?: boolean;
  starts_at?: string | null;
  /** Null when the event hides its end time. */
  ends_at?: string | null;
  /** Off: people only see the start (`schedule_label` has no end). */
  shows_end_time?: boolean;
  room_name?: string | null;
  external_location?: string | null;
  instructor?: InstructorLanding | null;
  remaining: number;
  capacity: number;
  sold_out: boolean;
  already_registered: boolean;
  date_label?: string | null;
  schedule_label?: string | null;
  price_rows: Array<LandingPriceRow>;
  installment_due_dates?: Array<string>;
  session_summary?: {
    extra_count: number;
    weekday: number | null;
    start_time: string | null;
    end_time: string | null;
  } | null;
  components: Array<LandingComponentCard>;
  payment_qr_url?: string | null;
  /** ADR-064: participant types this viewer can see (showcase events only). */
  participation?: LandingParticipation | null;
}

export interface AdminEventListItem {
  kind: EventOfferingKind;
  id: string;
  name: string;
  slug: string;
  date_label: string | null;
  starts_at: string | null;
  status: EventStatus;
  /** `configured` marks an event configured by participant types (the list carries no `configuration_model`). */
  type?: EventType | null;
  type_label?: string | null;
  holding_registrations: number;
  capacity: number | null;
  simple_registration_enabled?: boolean;
}

/** A dateless session of a duplicated draft (Bogotá weekday 0 = Monday, HH:MM times). */
export interface EventSessionTemplate {
  label: string | null;
  weekday: number;
  start_time: string;
  end_time: string;
  room_id: string | null;
  external_location: string | null;
  is_main: boolean;
}

/** "Editar lista": a label carries no behavior; it is never deleted, only stops being offered. */
export interface EventTypeLabel {
  id: string;
  name: string;
  position: number;
  is_offered: boolean;
  events_count: number;
}

export interface EventTypeLabelUpdatePayload {
  name?: string;
  position?: number;
  is_offered?: boolean;
}

export interface EventAdmin {
  id: string;
  name: string;
  description: string | null;
  /** Null only for a duplicated draft that still waits for its dates. */
  starts_at: string | null;
  ends_at: string | null;
  /** Off: the end is stored (room booking) but people only see the start. */
  shows_end_time?: boolean;
  session_templates?: Array<EventSessionTemplate> | null;
  room_id: string | null;
  external_location?: string | null;
  instructor_id: string | null;
  capacity: number;
  image_key: string | null;
  image_url: string | null;
  slug: string;
  requires_partner: boolean;
  simple_registration_enabled?: boolean;
  is_collaboration: boolean;
  collaborator_user_id: string | null;
  collaborator_email: string | null;
  collaborator_display_name: string | null;
  collaborator_participation_percentage: string | number;
  payment_qr_key: string | null;
  payment_qr_url: string | null;
  base_price: string | number;
  type: EventType;
  type_label: string;
  type_label_id?: string | null;
  configuration_model?: EventConfigurationModel;
  tax_type_id: string;
  status: EventStatus;
  published_at: string | null;
  price_tiers: Array<EventPriceTier>;
  installments?: Array<EventInstallmentDefinition>;
  holding_registrations: number;
  fields_locked: boolean;
  visibility?: EventVisibility;
  access_token?: string | null;
  sessions?: Array<EventSession>;
  uses_participant_types?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComboComponent {
  id: string;
  name: string;
  slug: string;
  starts_at: string;
  ends_at: string;
  room_id: string;
  instructor_id: string;
  status: EventStatus;
}

export interface ComboAdmin {
  id: string;
  name: string;
  slug: string;
  image_key: string | null;
  image_url: string | null;
  base_price: string | number;
  tax_type_id: string;
  status: EventStatus;
  published_at: string | null;
  event_ids: Array<string>;
  components: Array<ComboComponent>;
  price_tiers: Array<EventPriceTier>;
  holding_registrations: number;
  fields_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCreatePayload {
  name: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  shows_end_time?: boolean;
  room_id?: string | null;
  external_location?: string | null;
  instructor_id?: string | null;
  capacity: number;
  requires_partner?: boolean;
  is_collaboration?: boolean;
  collaborator_email?: string | null;
  collaborator_participation_percentage?: number | string;
  /** Legacy creation is closed (`EVENT_LEGACY_CREATE_CLOSED`): the UI only creates configured events. */
  configuration_model: 'participant_types';
  type_label_id: string;
}

export interface EventUpdatePayload {
  name?: string;
  description?: string | null;
  starts_at?: string;
  ends_at?: string;
  shows_end_time?: boolean;
  room_id?: string | null;
  instructor_id?: string;
  /** Configured events only: drop the instructor. */
  clear_instructor?: boolean;
  type_label_id?: string;
  capacity?: number;
  requires_partner?: boolean;
  simple_registration_enabled?: boolean;
  is_collaboration?: boolean;
  collaborator_email?: string | null;
  clear_collaborator?: boolean;
  collaborator_participation_percentage?: number | string;
  base_price?: number | string;
  type?: EventType;
  status?: EventStatus;
  price_tiers?: Array<EventPriceTierInput>;
  external_location?: string | null;
  installments?: Array<EventInstallmentDefinition>;
}

export interface ComboCreatePayload {
  event_ids: Array<string>;
  base_price: number | string;
  price_tiers: Array<EventPriceTierInput>;
}

export interface ComboUpdatePayload {
  event_ids?: Array<string>;
  base_price?: number | string;
  status?: EventStatus;
  price_tiers?: Array<EventPriceTierInput>;
}

export interface PriceConditionCatalogItem {
  condition_type: string;
  label: string;
  param_schema: Record<string, unknown>;
  /** The participant-type editor offers only these ("Comunidad Dansship"). */
  offered_in_editor?: boolean;
}

export interface PartnerLookupResponse {
  found: boolean;
  display_name: string | null;
  error_code: string | null;
}

export interface EventPurchaseCreatePayload {
  slug: string;
  payment_method_type: 'transfer' | 'card' | 'wallet';
  partner_email?: string | null;
  access_token?: string | null;
  sequences?: Array<number> | null;
}

export interface EventPurchaseResponse {
  purchase_id: string;
  payment_intent_id: string;
  offering_type: EventOfferingKind;
  resolved_price: string | number;
  matched_condition_type: string | null;
  partner_user_id: string | null;
  event_ids: Array<string>;
  payment_qr_url?: string | null;
}

export interface InstructorTeachingRoom {
  id: string | null;
  name: string;
  image_url: string | null;
  external_location?: string | null;
}

export interface InstructorTeachingEvent {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  room: InstructorTeachingRoom;
  type?: EventType | null;
  type_label?: string | null;
  capacity: number;
  registered_count: number;
  sessions?: Array<InstructorTeachingSession>;
}

export interface InstructorTeachingUpcomingWeek {
  requested_week_start: string;
  resolved_week_start: string;
  jumped: boolean;
  events: Array<InstructorTeachingEvent>;
  focus_day: string | null;
}

export interface InstructorTeachingRosterEntry {
  display_name: string;
  email: string;
}

export interface EventRosterEntry {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  status: EventRegistrationStatus;
  source: EventRegistrationSource;
  combo_id: string | null;
  combo_name: string | null;
  purchase_id: string;
  created_at: string;
  installments?: Array<RegistrationInstallment> | null;
}

export interface AdminUserEventComboComponent {
  id: string;
  name: string;
  starts_at: string;
}

export interface AdminUserEventRegistration {
  id: string;
  event_id: string;
  event_name: string;
  type?: EventType | null;
  type_label?: string | null;
  starts_at: string;
  status: EventRegistrationStatus;
  source: EventRegistrationSource;
  combo_id: string | null;
  combo_name: string | null;
  purchase_id: string;
  resolved_price: string | number;
  combo_events: Array<AdminUserEventComboComponent>;
}

export type MyEventRegistrationScope = 'upcoming' | 'history';

export interface EventSession {
  id: string;
  starts_at: string;
  ends_at: string;
  room_id: string | null;
  room_name?: string | null;
  external_location?: string | null;
  status: 'active' | 'cancelled';
  label: string | null;
  is_main: boolean;
  occurrence_date?: string | null;
}

export interface RegistrationSession {
  id: string;
  starts_at: string;
  ends_at: string;
  status: string;
  label: string | null;
  room_name: string | null;
  external_location: string | null;
  is_main: boolean;
}

export interface InstructorTeachingSession {
  id: string;
  starts_at: string;
  ends_at: string;
  label: string | null;
  room_name: string | null;
  external_location: string | null;
  is_main: boolean;
}

export interface EventInvite {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
}

export interface RecurrencePreview {
  occurrences: Array<{
    occurrence_date: string;
    starts_at: string;
    ends_at: string;
    skipped: boolean;
  }>;
  conflicts: Array<{
    occurrence_date: string;
    kind: string;
    label: string;
    source_id: string | null;
  }>;
}

export interface MyEventRegistration {
  id: string;
  event_id: string;
  event_name: string;
  event_slug: string;
  starts_at: string;
  ends_at: string;
  room_name: string | null;
  instructor_name: string | null;
  type?: EventType | null;
  type_label?: string | null;
  status: EventRegistrationStatus;
  source: EventRegistrationSource;
  combo_id: string | null;
  combo_name: string | null;
  combo_slug: string | null;
  purchase_id: string;
  payment_intent_id: string | null;
  payment_status: string | null;
  external_location?: string | null;
  installments?: Array<RegistrationInstallment> | null;
  installment_payment_options?: Array<InstallmentPaymentOption>;
  sessions?: Array<RegistrationSession>;
  created_at: string;
}

export interface EventImageUploadRequest {
  content_type: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface EventImageUploadResponse {
  upload_url: string;
  file_key: string;
}

export interface EventImageConfirmRequest {
  file_key: string;
}

export interface CollaboratorEventSummary {
  id: string;
  name: string;
  slug: string;
  type?: EventType | null;
  type_label?: string | null;
  starts_at: string;
  ends_at: string;
  status: EventStatus;
  payment_qr_url: string | null;
  enrolled_count: number;
  pending_review_count: number;
}

export interface DirectRegistrationPayload {
  email: string;
  full_name?: string | null;
  phone_number?: string | null;
  phone_country_code?: string | null;
}

export interface CollaboratorPaymentItem {
  id: string;
  purchase_id: string;
  payer_user_id: string;
  payer_email: string;
  payer_display_name: string;
  amount: string | number;
  status: string;
  payment_method_type: string;
  created_at: string;
  proof_uploaded_at: string | null;
  has_proof: boolean;
  proof_view_url: string | null;
}
