import type { PaymentMethod } from '../payments/payments.models';

export type RecoveryPlanState = 'active' | 'expired_in_grace';
export type CreditLossReason = 'late_cancellation' | 'no_show';
export type ClassRecoveryStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled' | 'returned_to_wallet';

export interface ClassRecoverySettings {
  recovery_window_days: number;
  recovery_grace_days: number;
  recovery_extension_days: number;
  updated_at?: string | null;
}

export type UpdateClassRecoverySettingsPayload = Omit<ClassRecoverySettings, 'updated_at'>;

export interface RecoverableClass {
  booking_id: string;
  attendee_user_id: string;
  attendee_name: string | null;
  class_name: string | null;
  class_start: string;
  class_end: string | null;
  instructor_name: string | null;
  loss_reason: CreditLossReason;
  unit_price: number;
  /** `null` while a payment for this class is in review. */
  deadline: string | null;
  /** A payment for it is awaiting review: shown, but not selectable. */
  in_review: boolean;
}

export interface RecoverableSubscription {
  subscription_id: string;
  plan_id: string;
  plan_name: string;
  plan_state: RecoveryPlanState;
  expiration_date: string;
  grace_deadline: string | null;
  unit_price: number;
  unused_credits: number;
  /** Unused credits sitting in a payment awaiting review (not part of `unused_credits`). */
  unused_in_review: number;
  classes: Array<RecoverableClass>;
}

export interface RecoverableList {
  settings: ClassRecoverySettings;
  subscriptions: Array<RecoverableSubscription>;
}

export interface UnusedCreditSelection {
  subscription_id: string;
  quantity: number;
}

export interface RecoverySelection {
  booking_ids: Array<string>;
  unused_credits: Array<UnusedCreditSelection>;
}

export interface CreateClassRecoveryPayload extends RecoverySelection {
  payment_method_type: PaymentMethod;
}

export interface ClassRecoveryPreview {
  classes_count: number;
  total_amount: number;
  tax_amount: number;
  wallet_applied: number;
  amount_to_charge: number;
  extension_days: number;
}

export interface ClassRecoveryLine {
  id: string;
  subscription_id: string;
  plan_id: string;
  plan_name: string | null;
  kind: 'lost_booking' | 'unused_credit';
  quantity: number;
  plan_state_at_submit: RecoveryPlanState;
  status: 'pending' | 'approved' | 'released';
  unit_price: number;
  tax_amount: number;
  lost_booking_id: string | null;
  attendee_user_id: string | null;
  attendee_name: string | null;
  class_name: string | null;
  class_start: string | null;
}

export interface ClassRecovery {
  id: string;
  status: ClassRecoveryStatus;
  payment_intent_id: string | null;
  payment_status: string | null;
  total_amount: number;
  wallet_applied: number;
  amount_to_charge: number;
  wallet_returned_amount: number | null;
  classes_count: number;
  usable_until: string | null;
  reactivated_until: string | null;
  submitted_at: string;
  lines: Array<ClassRecoveryLine>;
}

export interface ClassRecoveryReviewSubscription {
  subscription_id: string;
  plan_name: string;
  expiration_date: string;
  days_since_expiration: number | null;
  reactivated_at: string | null;
  will_reactivate: boolean;
}

export interface ClassRecoveryReview {
  recovery: ClassRecovery;
  outcome: 'approve' | 'return_to_wallet';
  outcome_reason: string | null;
  usable_until: string;
  subscriptions: Array<ClassRecoveryReviewSubscription>;
}

export interface CourtesyCreditReturn {
  booking_id: string;
  action: string;
  reason: string | null;
  created_at: string;
}

export interface UserClassRecoveries {
  recoverable: Array<RecoverableSubscription>;
  recoveries: Array<ClassRecovery>;
  courtesy: Array<CourtesyCreditReturn>;
}
