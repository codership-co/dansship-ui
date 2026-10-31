export interface BenefitDefinitionSummary {
  id: string;
  code: string;
  name: string;
  benefit_type: string;
}

export interface BenefitGrant {
  id: string;
  benefit_definition_id: string;
  user_id: string;
  status: string;
  granted_at: string;
  expires_at: string | null;
  consumed_at: string | null;
  consumed_subscription_id: string | null;
  consumed_booking_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  benefit_definition: BenefitDefinitionSummary | null;
}

export interface ListBenefitGrantsParams {
  user_id: string;
}

export interface BenefitWindow {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  starts_on: string | null;
  ends_on: string | null;
}

export interface UpdateBenefitWindowPayload {
  is_active?: boolean;
  starts_on?: string | null;
  ends_on?: string | null;
}

export type TwoForOneWeekStatus = 'draft' | 'published' | 'archived';

export interface TwoForOneWeek {
  id: string;
  week_start_date: string;
  week_end_date: string;
  status: TwoForOneWeekStatus;
  promo_date: string | null;
  locked: boolean;
}

export interface SetTwoForOneWeekPayload {
  promo_date: string;
}
