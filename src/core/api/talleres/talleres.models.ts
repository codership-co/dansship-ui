export type WorkshopStatus = 'draft' | 'published';
export type WorkshopOfferingKind = 'workshop' | 'combo';
export type WorkshopRegistrationSource = 'direct' | 'combo';
export type WorkshopRegistrationStatus = 'pending_payment' | 'confirmed' | 'expired' | 'rejected';

export interface WorkshopPriceTierInput {
  condition_type: string;
  condition_params: Record<string, unknown>;
  price: number | string;
}

export interface WorkshopPriceTier {
  id: string;
  position: number;
  condition_type: string;
  condition_params: Record<string, unknown>;
  price: string | number;
}

export interface WorkshopCatalogCard {
  kind: WorkshopOfferingKind;
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

export interface WorkshopLanding {
  kind: WorkshopOfferingKind;
  id: string;
  slug: string;
  name: string;
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
}

export interface AdminWorkshopListItem {
  kind: WorkshopOfferingKind;
  id: string;
  name: string;
  slug: string;
  date_label: string | null;
  starts_at: string | null;
  status: WorkshopStatus;
  holding_registrations: number;
  capacity: number | null;
}

export interface WorkshopAdmin {
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
  base_price: string | number;
  tax_type_id: string;
  status: WorkshopStatus;
  published_at: string | null;
  price_tiers: Array<WorkshopPriceTier>;
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
  status: WorkshopStatus;
}

export interface ComboAdmin {
  id: string;
  name: string;
  slug: string;
  image_key: string | null;
  image_url: string | null;
  base_price: string | number;
  tax_type_id: string;
  status: WorkshopStatus;
  published_at: string | null;
  workshop_ids: Array<string>;
  components: Array<ComboComponent>;
  price_tiers: Array<WorkshopPriceTier>;
  holding_registrations: number;
  fields_locked: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkshopCreatePayload {
  name: string;
  description?: string | null;
  starts_at: string;
  ends_at: string;
  room_id: string;
  instructor_id: string;
  capacity: number;
  requires_partner: boolean;
  base_price: number | string;
  price_tiers: Array<WorkshopPriceTierInput>;
}

export interface WorkshopUpdatePayload {
  name?: string;
  description?: string | null;
  starts_at?: string;
  ends_at?: string;
  room_id?: string;
  instructor_id?: string;
  capacity?: number;
  requires_partner?: boolean;
  base_price?: number | string;
  status?: WorkshopStatus;
  price_tiers?: Array<WorkshopPriceTierInput>;
}

export interface ComboCreatePayload {
  workshop_ids: Array<string>;
  base_price: number | string;
  price_tiers: Array<WorkshopPriceTierInput>;
}

export interface ComboUpdatePayload {
  workshop_ids?: Array<string>;
  base_price?: number | string;
  status?: WorkshopStatus;
  price_tiers?: Array<WorkshopPriceTierInput>;
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

export interface WorkshopPurchaseCreatePayload {
  slug: string;
  payment_method_type: 'transfer' | 'card' | 'wallet';
  partner_email?: string | null;
}

export interface WorkshopPurchaseResponse {
  purchase_id: string;
  payment_intent_id: string;
  offering_type: WorkshopOfferingKind;
  resolved_price: string | number;
  matched_condition_type: string | null;
  partner_user_id: string | null;
  workshop_ids: Array<string>;
}

export interface WorkshopRosterEntry {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  status: WorkshopRegistrationStatus;
  source: WorkshopRegistrationSource;
  combo_id: string | null;
  combo_name: string | null;
  purchase_id: string;
  created_at: string;
}

export interface AdminUserWorkshopComboComponent {
  id: string;
  name: string;
  starts_at: string;
}

export interface AdminUserWorkshopRegistration {
  id: string;
  workshop_id: string;
  workshop_name: string;
  starts_at: string;
  status: WorkshopRegistrationStatus;
  source: WorkshopRegistrationSource;
  combo_id: string | null;
  combo_name: string | null;
  purchase_id: string;
  resolved_price: string | number;
  combo_workshops: Array<AdminUserWorkshopComboComponent>;
}

export type MyWorkshopRegistrationScope = 'upcoming' | 'history';

export interface MyWorkshopRegistration {
  id: string;
  workshop_id: string;
  workshop_name: string;
  workshop_slug: string;
  starts_at: string;
  ends_at: string;
  room_name: string | null;
  instructor_name: string | null;
  status: WorkshopRegistrationStatus;
  source: WorkshopRegistrationSource;
  combo_id: string | null;
  combo_name: string | null;
  combo_slug: string | null;
  purchase_id: string;
  payment_intent_id: string | null;
  payment_status: string | null;
  created_at: string;
}

export interface WorkshopImageUploadRequest {
  content_type: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface WorkshopImageUploadResponse {
  upload_url: string;
  file_key: string;
}

export interface WorkshopImageConfirmRequest {
  file_key: string;
}
