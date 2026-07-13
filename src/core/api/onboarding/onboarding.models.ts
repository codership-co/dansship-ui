export enum OnboardingStepKey {
  PROFILE = 'student_profile',
  HEALTH = 'health_data',
  PREFERENCES = 'student_preferences',
  OPERATIONAL_PROFILE = 'operational_profile',
  CERTIFICATIONS = 'certifications',
}

export enum OnboardingTrackKey {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface OnboardingAvailabilitySlot {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface InstructorDisciplinePayload {
  discipline_name: string;
  years_experience: number;
}

export interface InstructorCertificationPayload {
  title: string;
  issuer: string;
  file_key?: string;
  issue_date?: string | null;
}

export interface OnboardingStep {
  step_key: OnboardingStepKey;
  status: string;
  completed: boolean;
}

export interface OnboardingTrack {
  track: OnboardingTrackKey;
  completed: boolean;
  pending_steps: Array<OnboardingStepKey>;
  steps: Array<OnboardingStep>;
}

export interface OnboardingStatus {
  required: boolean;
  completed: boolean;
  next_step: OnboardingStepKey | null;
  tracks: Array<OnboardingTrack>;
}

export interface CompleteStudentStepPayload {
  stepKey: OnboardingStepKey.PROFILE;
  track: OnboardingTrackKey;
  payload: {
    full_name: string;
    birth_date?: string;
    phone_country_code?: string;
    phone_number?: string;
    document_type?: string;
    document_value?: string;
    city?: string;
    address?: string;
  };
}

export interface CompleteHealthStepPayload {
  stepKey: OnboardingStepKey.HEALTH;
  track: OnboardingTrackKey;
  payload: {
    emergency_contact_name?: string;
    emergency_contact_relative?: string;
    emergency_contact_phone_country_code?: string;
    emergency_contact_phone_number?: string;
    eps?: string;
    existing_medical_conditions?: string;
  };
}

export interface CompletePreferencesStepPayload {
  stepKey: OnboardingStepKey.PREFERENCES;
  track: OnboardingTrackKey;
  payload: {
    heard_about_us?: string;
    current_level?: string;
    goals: Array<string>;
    disciplines: Array<string>;
    preferred_schedules: Array<string>;
  };
}

export interface CompleteOperationalProfileStepPayload {
  stepKey: OnboardingStepKey.OPERATIONAL_PROFILE;
  track: OnboardingTrackKey.INSTRUCTOR;
  payload: {
    instagram: string;
    availability: Array<OnboardingAvailabilitySlot>;
    disciplines: Array<InstructorDisciplinePayload>;
  };
}

export interface CompleteCertificationsStepPayload {
  stepKey: OnboardingStepKey.CERTIFICATIONS;
  track: OnboardingTrackKey.INSTRUCTOR;
  payload: {
    documents: Array<InstructorCertificationPayload>;
  };
}

export type CompleteStepPayload =
  | CompleteStudentStepPayload
  | CompleteHealthStepPayload
  | CompletePreferencesStepPayload
  | CompleteOperationalProfileStepPayload
  | CompleteCertificationsStepPayload;

export enum OnboardingUploadPurpose {
  INSTRUCTOR_CERTIFICATION = 'instructor:certification',
}

export interface OnboardingUploadRequest {
  purpose: OnboardingUploadPurpose;
  content_type: string;
}

export interface PresignedUploadResponse {
  upload_url: string;
  file_key: string;
}
