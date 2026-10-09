export type EventStatus = 'draft' | 'published';
export type EventType = 'taller' | 'clase_especial';
export type EventOfferingKind = 'event' | 'combo';
export type EventRegistrationSource = 'direct' | 'combo';
export type EventRegistrationStatus = 'pending_payment' | 'confirmed' | 'expired' | 'rejected';

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
}

export interface LandingComponentCard {
  slug: string;
  name: string;
  image_url: string | null;
  date_label: string;
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
  starts_at?: string | null;
  ends_at?: string | null;
  room_name?: string | null;
  instructor?: InstructorLanding | null;
  remaining: number;
  capacity: number;
  sold_out: boolean;
  already_registered: boolean;
  date_label?: string | null;
  schedule_label?: string | null;
  price_rows: Array<LandingPriceRow>;
  components: Array<LandingComponentCard>;
  payment_qr_url?: string | null;
}

export interface AdminEventListItem {
  kind: EventOfferingKind;
  id: string;
  name: string;
  slug: string;
  date_label: string | null;
  starts_at: string | null;
  status: EventStatus;
  type?: EventType | null;
  type_label?: string | null;
  holding_registrations: number;
  capacity: number | null;
}

export interface EventAdmin {
  id: string;
  name: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  room_id: string;
  instructor_id: string;
  capacity: number;
  image_key: string | null;
  image_url: string | null;
  slug: string;
  requires_partner: boolean;
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
  tax_type_id: string;
  status: EventStatus;
  published_at: string | null;
  price_tiers: Array<EventPriceTier>;
  holding_registrations: number;
  fields_locked: boolean;
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
  room_id: string;
  instructor_id: string;
  capacity: number;
  requires_partner: boolean;
  is_collaboration?: boolean;
  collaborator_email?: string | null;
  collaborator_participation_percentage?: number | string;
  base_price: number | string;
  type?: EventType;
  price_tiers: Array<EventPriceTierInput>;
}

export interface EventUpdatePayload {
  name?: string;
  description?: string | null;
  starts_at?: string;
  ends_at?: string;
  room_id?: string;
  instructor_id?: string;
  capacity?: number;
  requires_partner?: boolean;
  is_collaboration?: boolean;
  collaborator_email?: string | null;
  clear_collaborator?: boolean;
  collaborator_participation_percentage?: number | string;
  base_price?: number | string;
  type?: EventType;
  status?: EventStatus;
  price_tiers?: Array<EventPriceTierInput>;
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
  id: string;
  name: string;
  image_url: string | null;
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
