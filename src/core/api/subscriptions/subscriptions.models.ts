export interface PublicPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  classes_included: number;
  validity_days: number;
  is_recommended?: boolean;
  recommended_order?: number | null;
}

export interface DiscountValidationResponse {
  is_valid: boolean;
  type?: 'percentage' | 'fixed_amount';
  value?: number;
  message?: string;
}

export interface PurchaseSubscriptionPayload {
  plan_id: string;
  discount_code?: string;
  start_date?: string;
}

export type SubscriptionStatus = 'pending_payment' | 'active' | 'expired' | 'canceled';

export interface SubscriptionSummary {
  total_remaining_classes: number;
  active_count: number;
  next_expiration: string | null;
}

export interface MySubscriptionsResponse {
  subscriptions: Array<ActiveSubscription>;
  summary: SubscriptionSummary;
}

export interface ActiveSubscription {
  id: string;
  plan_id: string;
  status: SubscriptionStatus;

  plan_name_snapshot: string;
  class_count_snapshot: number;
  price_snapshot: number;
  expiration_policy_snapshot: string;

  discount_name_snapshot: string | null;
  discount_value_snapshot: number | null;
  discount_type_snapshot: string | null;

  remaining_classes: number;
  start_date: string;
  expiration_date: string;
  original_price: number;
  final_price: number;

  // Frontend relations
  plan?: PublicPlan;
}
