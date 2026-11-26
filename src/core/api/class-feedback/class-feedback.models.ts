export interface ClassFeedbackCreatePayload {
  scheduled_class_id: string;
  class_rating: number;
  instructor_rating: number;
  comment?: string | null;
  /** The managed minor whose class a guardian rates; omitted = the signed-in user. */
  attendee_user_id?: string;
}

export interface ClassFeedbackItem {
  id: string;
  user_id: string;
  scheduled_class_id: string;
  instructor_id: string;
  class_rating: number;
  instructor_rating: number;
  comment?: string | null;
  created_at: string;
  class_name?: string | null;
  class_start_time?: string | null;
  class_end_time?: string | null;
  instructor_name?: string | null;
  user_email?: string | null;
  user_name?: string | null;
  /** Set when a guardian rated a managed minor's class (`user_id` is the minor). */
  rated_by_user_id?: string | null;
  /** Guardian's name; admin report only. */
  rated_by_name?: string | null;
}

export interface ClassFeedbackListResponse {
  items: Array<ClassFeedbackItem>;
}

export interface ClassFeedbackAdminReport {
  average_class_rating: number | null;
  average_instructor_rating: number | null;
  rating_count: number;
  items: Array<ClassFeedbackItem>;
}
