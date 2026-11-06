export interface PersonSearchResult {
  id: string;
  full_name: string;
  email: string | null;
}

export type BookingOrigin = 'plan' | 'first_free_class' | 'gift' | 'two_for_one';

export interface SimplePersonInput {
  full_name: string;
  email: string;
  phone_country_code?: string | null;
  phone_number: string;
  terms_accepted: boolean;
}

export interface SimpleAccountResult {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  /** False when the email or phone already belonged to an account. */
  created: boolean;
}

export interface CompanionInput {
  user_id?: string;
  new_person?: SimplePersonInput;
}

export interface AssistedBookingPayload {
  user_id: string;
  scheduled_class_id: string;
  reason?: string;
  as_attended: boolean;
  gift: boolean;
  companion?: CompanionInput;
}

export interface AssistedBookingResult {
  booking_id: string;
  companion_booking_id: string | null;
  companion_created_account: boolean;
  companion_error_code: string | null;
}

export interface AssistedBookingItem {
  id: string;
  scheduled_class_id: string;
  class_name: string | null;
  start_time: string;
  origin: BookingOrigin;
  has_companion: boolean;
  is_companion: boolean;
  can_return_credit: boolean;
  /** Day view only. */
  status: 'active' | 'attended' | 'no_show' | 'cancelled';
  end_time: string | null;
  credit_restored: boolean | null;
  /** A plan booking cancelled or already held whose credit is still used. */
  can_reimburse: boolean;
  /** "Add 2x1 companion" would be accepted for this booking. */
  can_add_companion: boolean;
}

export interface AssistedReimbursePayload {
  reason: string;
}

export interface AssistedCancelPayload {
  reason: string;
  return_credit: boolean;
}

export interface AssistedCancelResult {
  booking_id: string;
  cascaded_booking_ids: Array<string>;
  credit_returned: boolean;
}

export interface AccountContactPayload {
  full_name?: string;
  email?: string;
  phone_country_code?: string;
  phone_number?: string;
  reason?: string;
}

export interface AccountContactResult {
  user_id: string;
  full_name: string;
  email: string | null;
  pending_email: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
}

export type AccountLinkKind = 'email_verification' | 'instructor_invitation';

export interface AccountLinkStatus {
  kind: AccountLinkKind;
  applicable: boolean;
  reason_code: string | null;
  active: boolean;
  expires_at: string | null;
  token_masked: string | null;
}

export interface AccountLinkIssueResult {
  kind: AccountLinkKind;
  delivery: 'copy' | 'email';
  link: string | null;
  sent_to: string | null;
  expires_at: string | null;
}

export interface MergePreview {
  blocks: Array<{ code: string; detail: string | null }>;
  to_move: Record<string, number>;
}

export interface MergePayload {
  primary_user_id: string;
  secondary_user_id: string;
  reason: string;
  irreversible_confirmed: boolean;
}

export interface MergeResult {
  kept_user_id: string;
  closed_user_id: string;
  moved: Record<string, number>;
  left_on_closed_account: Record<string, number>;
}

export type ContactLeadStatus = 'new' | 'following' | 'converted' | 'not_interested';
export type ContactChannel = 'whatsapp' | 'instagram' | 'facebook' | 'other';

export interface ContactLeadAccountMatch {
  user_id: string;
  full_name: string;
  email: string | null;
}

export interface ContactLeadNote {
  id: string;
  body: string;
  created_by_full_name: string | null;
  created_at: string;
}

export interface ContactLead {
  id: string;
  name: string | null;
  channel: ContactChannel;
  contact: string;
  inquiry: string | null;
  status: ContactLeadStatus;
  contacted_at: string;
  created_by_full_name: string | null;
  linked_user: ContactLeadAccountMatch | null;
  notes: Array<ContactLeadNote>;
  notes_count: number;
  notes_moved_to_user: boolean;
  suggested_accounts: Array<ContactLeadAccountMatch>;
}

export interface ContactLeadList {
  counts: Partial<Record<ContactLeadStatus, number>>;
  leads: Array<ContactLead>;
}

export interface ContactLeadCreatePayload {
  name?: string;
  channel: ContactChannel;
  contact: string;
  inquiry?: string;
}

export type AdminBenefitKind = 'free_class' | 'percentage_discount' | 'fixed_discount';

export interface BenefitGrantPayload {
  kind: AdminBenefitKind;
  value?: number;
  valid_days: number;
  reason: string;
}

export interface BenefitGrantItem {
  id: string;
  kind: string;
  name: string;
  value: string | number | null;
  status: string;
  granted_at: string;
  expires_at: string | null;
  source: 'admin' | 'system';
  reason: string | null;
  can_revoke: boolean;
}
