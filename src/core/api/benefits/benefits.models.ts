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
