export interface UsersSearchParams {
  email?: string;
}

export interface UserDeactivateResponse {
  deactivated: boolean;
}

export interface UserReactivateResponse {
  reactivated: boolean;
}

export interface UserResponse {
  id: string;
  full_name: string;
  onboarding_completed?: boolean;
  email: string;
  created_at: string;
  roles: Array<string>;
  permissions: Array<string>;
}

export interface AdminUserInstructorProfile {
  id: string;
  bio: string | null;
  photo_url: string | null;
  contact_info: string | null;
  created_at: string;
  updated_at: string;
  completion_percent?: number;
}

export interface AdminUserDetailsResponse {
  id: string;
  email: string;
  full_name: string;
  birth_date: string | null;
  display_name: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  document_type: string | null;
  document_value: string | null;
  city: string | null;
  address: string | null;
  preferred_language: 'en' | 'es';
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_email_verified: boolean;
  requires_onboarding: boolean;
  onboarding_completed: boolean;
  onboarding_pending_steps: Array<string>;
  roles: Array<string>;
  permissions: Array<string>;
  has_instructor_profile: boolean;
  instructor_profile: AdminUserInstructorProfile | null;
}
