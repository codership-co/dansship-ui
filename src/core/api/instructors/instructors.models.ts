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
  status: 'active' | 'attended' | 'no_show' | 'waitlisted' | 'cancelled';
  created_at: string;
}

export interface ClassRosterResponse {
  class_id: string;
  enrolled: Array<RosterStudent>;
  waitlisted: Array<RosterStudent>;
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
}

export interface InstructorInviteResponse {
  user_id: string;
  email: string;
}

export interface InstructorDeactivateResponse {
  user_id: string;
}

export interface AcceptInstructorInvitePayload {
  token: string;
}

export interface AcceptInstructorInviteResponse {
  accepted?: boolean;
  email: string;
  message?: string;
}
