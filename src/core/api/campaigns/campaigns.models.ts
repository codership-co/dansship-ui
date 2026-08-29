export type CampaignKind = 'free' | 'structured';
export type PlanStatusFilter = 'any' | 'active' | 'inactive';
export type CampaignQuestionType = 'text' | 'multiple_choice' | 'scale';
export type CampaignResponseStatus = 'answered' | 'dismissed';

export interface MultipleChoiceOption {
  id: string;
  label: string;
}

export interface TextQuestion {
  type: 'text';
  id: string;
  prompt: string;
  required: boolean;
}

export interface MultipleChoiceQuestion {
  type: 'multiple_choice';
  id: string;
  prompt: string;
  required: boolean;
  options: Array<MultipleChoiceOption>;
  allow_multiple: boolean;
}

export interface ScaleQuestion {
  type: 'scale';
  id: string;
  prompt: string;
  required: boolean;
  min: number;
  max: number;
  min_label?: string | null;
  max_label?: string | null;
}

export type CampaignQuestion = TextQuestion | MultipleChoiceQuestion | ScaleQuestion;

export interface CampaignAudience {
  plan_status: PlanStatusFilter;
  instructor_id?: string | null;
  class_definition_id?: string | null;
}

export interface Campaign {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  kind: CampaignKind;
  structured_type?: string | null;
  questions: Array<CampaignQuestion>;
  audience: CampaignAudience;
  valid_from?: string | null;
  valid_until?: string | null;
  is_active: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  response_count: number;
}

export interface StructuredCampaignType {
  type_key: string;
  label: string;
}

export interface PendingCampaign {
  id: string;
  title: string;
  description?: string | null;
  kind: CampaignKind;
  structured_type?: string | null;
  questions: Array<CampaignQuestion>;
  delivery_context?: Record<string, unknown> | null;
}

export interface PendingCampaignEnvelope {
  campaign: PendingCampaign | null;
}

export type CampaignAnswerValue = string | number | Array<string> | Record<string, string>;

export interface CampaignSubmitPayload {
  answers: Record<string, CampaignAnswerValue>;
}

export interface CampaignResponseItem {
  id: string;
  campaign_id: string;
  user_id: string;
  scope_key: string;
  answers: Record<string, unknown>;
  status: CampaignResponseStatus;
  created_at: string;
  user_email?: string | null;
  user_name?: string | null;
}

export interface CreateCampaignPayload {
  title: string;
  description?: string | null;
  kind: CampaignKind;
  structured_type?: string | null;
  questions?: Array<CampaignQuestion>;
  audience?: CampaignAudience;
  valid_from?: string | null;
  valid_until?: string | null;
}

export type UpdateCampaignPayload = Partial<
  Pick<CreateCampaignPayload, 'title' | 'description' | 'questions' | 'audience' | 'valid_from' | 'valid_until'>
>;

export interface ListCampaignsParams {
  is_active?: boolean;
  kind?: CampaignKind;
}
