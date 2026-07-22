export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  birth_date?: string | null;
  display_name: string | null;
  phone_country_code?: string | null;
  phone_number?: string | null;
  document_type?: string | null;
  document_value?: string | null;
  city?: string | null;
  address?: string | null;
  photo_url?: string | null;
  preferred_language?: 'en' | 'es';
  updated_at?: string;
  is_active?: boolean;
  is_email_verified?: boolean;
  requires_onboarding?: boolean;
  onboarding_completed?: boolean;
  onboarding_pending_steps?: Array<string>;
  roles?: Array<string>;
  permissions?: Array<string>;
  has_instructor_profile?: boolean;
  profile_completion_percent?: number;
  instructor_profile?: {
    id: string;
    bio: string | null;
    photo_url: string | null;
    contact_info: string | null;
    created_at: string;
    updated_at: string;
    completion_percent: number;
  } | null;
  created_at: string;
}

export interface User {
  id: number | string;
  username: string;
  baseProfileRedirect: string;
  email: string;
  birthDate?: string;
  preferredLanguage?: 'en' | 'es';
  name: string;
  fullName?: string;
  displayName?: string;
  phoneCountryCode?: string;
  phoneNumber?: string;
  documentType?: string;
  documentValue?: string;
  city?: string;
  address?: string;
  avatar?: string;
  bio?: string;
  isAdmin: boolean;
  isInstructor: boolean;
  isCoach: boolean;
  roles: Array<string>;
  permissions: Array<string>;
  isActive?: boolean;
  isEmailVerified?: boolean;
  requiresOnboarding?: boolean;
  onboardingCompleted?: boolean;
  onboardingPendingSteps?: Array<string>;
  updatedAt?: string;
  hasInstructorProfile?: boolean;
  profileCompletionPercent?: number;
  instructorProfile?: {
    id: string;
    bio?: string | null;
    photoUrl?: string | null;
    contactInfo?: string | null;
    createdAt?: string;
    updatedAt?: string;
    completionPercent?: number;
  } | null;
  joinDate: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  sportBackground?: {
    yearsOfExperience: number;
    trainingFrequency: string;
    preferredStyles: Array<string>;
    hasCompeted: boolean;
  };
  coachingProfile?: {
    yearsTeaching: number;
    certifications: Array<string>;
    specializations: Array<string>;
    teachingLocations: Array<string>;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  confirm_password: string;
  preferred_language?: string;
}

export interface RegisterResponse {
  email: string;
  verification_sent: boolean;
  message: string;
}

export interface VerifyEmailPayload {
  token: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
  message: string;
}

export interface ResendVerificationPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  code: string;
  new_password: string;
}

export interface UpdatePreferredLanguagePayload {
  preferred_language: string;
}

export interface UpdateProfilePayload {
  preferred_language?: string;
  full_name?: string;
  display_name?: string;
}

export interface UserPhotoUploadRequest {
  content_type: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface UserPhotoUploadResponse {
  upload_url: string;
  file_key: string;
}

export interface UserPhotoConfirmRequest {
  file_key: string;
}
