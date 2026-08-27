import type { ScheduledClass } from '../schedules/schedules.models';

export type BookingStatus = 'active' | 'cancelled' | 'attended' | 'no_show';

export interface Booking {
  id: string;
  user_id: string;
  scheduled_class_id: string;
  status: BookingStatus;
  created_at: string;
  cancelled_at?: string | null;
  credit_restored?: boolean | null;
  would_restore_credit?: boolean | null;
  subscription_id?: string | null;
  plan_name?: string | null;
  is_cancellable?: boolean;

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
  as_attended?: boolean;
}

export interface AdminBookingUser {
  id: string;
  email: string;
  is_active?: boolean;
}

export interface PublishedClass extends ScheduledClass {
  user_booking_status?: BookingStatus | null;
  user_booking_id?: string | null;
  user_booking_is_cancellable?: boolean | null;
  user_booking_would_restore_credit?: boolean | null;
}

export interface MarkAttendancePayload {
  status: 'attended' | 'no_show';
}
