export interface AgePolicy {
  own_account_min_age: number;
  managed_min_age: number;
  managed_max_age: number;
  guardian_contact_required_before_age: number;
  timezone: string;
  managed_users_enabled: boolean;
}

export interface ManagedUsersPolicy {
  key: string;
  version: string;
  asset_path: string;
}

export interface MinorHealthPayload {
  emergency_contact_name: string;
  emergency_contact_relative?: string | null;
  emergency_contact_phone_country_code?: string | null;
  emergency_contact_phone_number: string;
  eps?: string | null;
  existing_medical_conditions?: string | null;
  no_medical_conditions: boolean;
}

export interface CreateMinorPayload {
  given_name: string;
  family_name: string;
  birth_date: string;
  document_type: string;
  document_value: string;
  relationship: string;
  health: MinorHealthPayload;
  permission_declared: boolean;
  policy_accepted: boolean;
}

export interface MinorSummary {
  user_id: string;
  given_name: string | null;
  family_name: string | null;
  full_name: string;
  birth_date: string | null;
  age: number | null;
  document_type: string | null;
  document_value_masked: string | null;
  health_summary: string | null;
  health?: MinorHealthPayload | null;
  trial_available: boolean;
  trial_used: boolean;
  is_active: boolean;
}

export interface PendingMinorRequest {
  id: string;
  given_name: string;
  family_name: string;
  birth_date: string;
  status: string;
}

export interface FamilyListResponse {
  minors: Array<MinorSummary>;
  pending_requests: Array<PendingMinorRequest>;
}

export interface CreateMinorResponse {
  status: 'created' | 'pending_review';
  message?: string;
  minor?: MinorSummary;
}

export interface BookingPayerSubscription {
  id: string;
  plan_name: string | null;
  expiration_date: string | null;
  start_date: string | null;
  remaining_classes: number | null;
  bonus_classes_remaining?: number;
  bonus_expires_at?: string | null;
  status: string;
}

export interface BookingPayer {
  attendee_user_id: string;
  attendee_name: string | null;
  age: number | null;
  trial_eligible: boolean;
  subscriptions: Array<BookingPayerSubscription>;
}

export interface AdminFamilyView {
  view?: 'minor' | 'guardian';
  user_id?: string;
  minor?: MinorSummary;
  minors?: Array<MinorSummary & { relationship?: string | null }>;
  guardian?: { user_id: string; full_name: string; email: string | null; relationship: string } | null;
  pending_requests?: Array<{
    id: string;
    given_name: string;
    family_name: string;
    birth_date: string;
    document_type: string;
    relationship: string;
    status: string;
    matched_user_id?: string | null;
  }>;
}
