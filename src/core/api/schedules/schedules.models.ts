export type ScheduleStatus = 'draft' | 'published' | 'archived';

export interface ScheduledClass {
  id: string;
  schedule_week_id: string;
  class_definition_id: string;
  room_id: string;
  instructor_id: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled_count: number;
  is_cancelled?: boolean;
  cancellation_note?: string | null;
  cancelled_at?: string | null;
  cancelled_by_user_id?: string | null;

  class_definition?: { id: string; name: string; duration_minutes: number; level?: string | null };
  room?: { id: string; name: string; image_url?: string | null };
  instructor?: { id: string; user_id: string; email: string; full_name: string; photo_url?: string | null } | null;
}

export interface InstructorClassesResponse {
  assigned: Array<ScheduledClass>;
  taught: Array<ScheduledClass>;
}

export interface ScheduleWeek {
  id: string;
  week_start_date: string;
  status: ScheduleStatus;
  created_at: string;
  classes?: Array<ScheduledClass>;
}

export type AgendaEventType = 'studio_class' | 'space_rental_external' | 'internal_reserved_use' | 'blocked_space';

export interface AgendaEvent {
  event_type: AgendaEventType;
  source_id: string;
  room_id: string;
  start_time: string;
  end_time: string;
  status?: string | null;
  metadata: Record<string, string>;
}

export interface GetWeeksPayload {
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface GetAgendaEventsPayload {
  start_at: string;
  end_at: string;
  room_id?: string;
}

export interface AddClassPayload {
  class_definition_id: string;
  room_id: string;
  instructor_id?: string | null;
  start_time: string;
  end_time: string;
  capacity?: number;
}

export interface UpdateClassPayload extends Partial<AddClassPayload> {}

export interface EditPublishedClassPayload {
  room_id?: string;
  instructor_id?: string | null;
  capacity?: number;
}

export interface CancelPublishedClassPayload {
  cancellation_note?: string | null;
}

export interface UpcomingWeekResponse<TClass = ScheduledClass> {
  requested_week_start: string;
  resolved_week_start: string;
  jumped: boolean;
  classes: Array<TClass>;
  /** Colombia calendar day (YYYY-MM-DD) of the next bookable class. */
  focus_day: string | null;
}
