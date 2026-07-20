export enum ProfileDataKey {
  PROFILE = 'student_profile',
  HEALTH = 'health_data',
  PREFERENCES = 'student_preferences',
  OPERATIONAL_PROFILE = 'operational_profile',
  CERTIFICATIONS = 'certifications',
}

export enum ProfileTrackKey {
  STUDENT = 'student',
  INSTRUCTOR = 'instructor',
}

export enum DaysOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export interface OnboardingAvailabilitySlot {
  day_of_week: DaysOfWeek;
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
  step_key: ProfileDataKey;
  status: string;
  completed: boolean;
}

export interface OnboardingTrack {
  track: ProfileTrackKey;
  completed: boolean;
  pending_steps: Array<ProfileDataKey>;
  steps: Array<OnboardingStep>;
}

export interface OnboardingStatus {
  required: boolean;
  completed: boolean;
  next_step: ProfileDataKey | null;
  tracks: Array<OnboardingTrack>;
}

// PROFILE STEPS

export interface BasicProfilePayload {
  full_name: string;
  birth_date?: string;
  phone_country_code?: string;
  phone_number?: string;
  document_type?: string;
  document_value?: string;
  city?: string;
  address?: string;
}

export interface HealthProfilePayload {
  emergency_contact_name?: string;
  emergency_contact_relative?: string;
  emergency_contact_phone_country_code?: string;
  emergency_contact_phone_number?: string;
  eps?: string;
  existing_medical_conditions?: string;
}

export interface PreferencesProfilePayload {
  heard_about_us?: string;
  current_level?: string;
  goals: Array<string>;
  disciplines: Array<string>;
  preferred_schedules: Array<string>;
}

export interface OperationalProfilePayload {
  instagram: string;
  availability: Array<OnboardingAvailabilitySlot>;
  disciplines: Array<InstructorDisciplinePayload>;
}

export interface CertificationsProfilePayload {
  documents: Array<InstructorCertificationPayload>;
}

// ONBOARDING PROFILE STEPS

export interface CompleteStudentStepPayload {
  stepKey: ProfileDataKey.PROFILE;
  track: ProfileTrackKey.STUDENT;
  payload: BasicProfilePayload;
}

export interface CompleteHealthStepPayload {
  stepKey: ProfileDataKey.HEALTH;
  track: ProfileTrackKey.STUDENT;
  payload: HealthProfilePayload;
}

export interface CompletePreferencesStepPayload {
  stepKey: ProfileDataKey.PREFERENCES;
  track: ProfileTrackKey.STUDENT;
  payload: PreferencesProfilePayload;
}

export interface CompleteOperationalProfileStepPayload {
  stepKey: ProfileDataKey.OPERATIONAL_PROFILE;
  track: ProfileTrackKey.INSTRUCTOR;
  payload: OperationalProfilePayload;
}

export interface CompleteCertificationsStepPayload {
  stepKey: ProfileDataKey.CERTIFICATIONS;
  track: ProfileTrackKey.INSTRUCTOR;
  payload: CertificationsProfilePayload;
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
