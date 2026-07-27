import type { ScheduledClass } from '../schedules/schedules.models';

export type BookingStatus = 'active' | 'cancelled' | 'attended' | 'no_show' | 'waitlisted';

export interface Booking {
  id: string;
  user_id: string;
  scheduled_class_id: string;
  status: BookingStatus;
  created_at: string;
  subscription_id?: string | null;
  plan_name?: string | null;

  scheduled_class?: ScheduledClass;
}

export interface MyBooking extends Booking {
  scheduled_class: ScheduledClass;
}

export interface BookClassPayload {
  scheduled_class_id: string;
}

export interface BookingCancelPayload {
  cancellation_reason?: string;
}

export interface AdminBookClassPayload extends BookClassPayload {
  user_id: string;
  reason?: string;
}

export interface AdminBookingUser {
  id: string;
  email: string;
  is_active?: boolean;
}

export interface PublishedClass extends ScheduledClass {
  user_booking_status?: BookingStatus | null;
  user_booking_id?: string | null;
}

export interface MarkAttendancePayload {
  status: 'attended' | 'no_show';
}
