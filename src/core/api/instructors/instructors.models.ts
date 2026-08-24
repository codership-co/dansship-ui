export const INDEX_TO_DAY: Record<number, AvailabilityApiItem['day_of_week']> = {
  0: 'monday',
  1: 'tuesday',
  2: 'wednesday',
  3: 'thursday',
  4: 'friday',
  5: 'saturday',
  6: 'sunday',
};

export const DAY_TO_INDEX: Record<AvailabilityApiItem['day_of_week'], number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

export interface InstructorProfile {
  id: string;
  user_id: string;
  bio?: string | null;
  photo_url?: string | null;
  contact_info?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateInstructorProfilePayload {
  bio?: string | null;
  photo_url?: string | null;
  contact_info?: string | null;
}

export type UpdateInstructorProfilePayload = Partial<CreateInstructorProfilePayload>;

export interface AvailabilitySlot {
  // 0 = Monday, 6 = Sunday (normalized for UI)
  day_of_week: number;
  // 'HH:MM:SS'
  start_time: string;
  // 'HH:MM:SS'
  end_time: string;
}

export interface InstructorAvailability {
  slots: Array<AvailabilitySlot>;
}

export interface UpdateAvailabilityPayload {
  slots: Array<AvailabilitySlot>;
}

export interface AvailabilityApiItem {
  id: string;
  instructor_id: string;
  day_of_week: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface RosterStudent {
  // Booking ID
  id: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  status: 'active' | 'attended' | 'no_show' | 'cancelled';
  created_at: string;
}

export interface ClassRosterResponse {
  class_id: string;
  enrolled: Array<RosterStudent>;
  can_register_retroactive_attendance?: boolean;
  instructor_payment_document_issued?: boolean;
}

export interface InstructorStudentProfile {
  user_id: string;
  full_name: string;
  goals: Array<string>;
  disciplines: Array<string>;
  current_level: string | null;
}

export interface InstructorUserSearchResult {
  id: string;
  email: string;
  name?: string | null;
}

export interface ManualAddStudentPayload {
  user_id: string;
}

export interface AdminInstructorListItem {
  id: string | null;
  user_id: string;
  email: string;
  full_name?: string;
}

export interface InstructorInviteResponse {
  user_id: string;
  email: string;
}

export interface InstructorDeactivateResponse {
  user_id: string;
}

export interface InstructorReactivateResponse {
  reactivated: boolean;
}

export interface AcceptInstructorInvitePayload {
  token: string;
}

export interface AcceptInstructorInviteResponse {
  accepted?: boolean;
  email: string;
  message?: string;
}

export type InstructorCertificationContentType = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

export const InstructorCertificationContentTypes: Array<InstructorCertificationContentType> = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export interface InstructorCertificationUploadRequest {
  content_type: InstructorCertificationContentType;
}

export interface InstructorCertificationPresignedUpload {
  upload_url: string;
  file_key: string;
}

export interface InstructorCertification {
  id: string;
  instructor_profile_id: string;
  title: string;
  issuer: string;
  file_key: string;
  issue_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateInstructorCertificationPayload {
  title: string;
  issuer: string;
  file_key: string;
  issue_date?: string | null;
}
