export interface GetPlansParams {
  is_active?: boolean;
}

export interface PlanClassGroupAllowance {
  id?: string;
  class_group_id: string;
  max_classes?: number | null;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  tax_type_id: string;
  classes_included: number;
  validity_days: number;
  features: Array<string>;
  class_group_allowances: Array<PlanClassGroupAllowance>;
  is_active: boolean;
  is_recommended: boolean;
  show_on_landing: boolean;
  recommended_order?: number | null;
  created_at: string;
}

export type CreatePlanPayload = Omit<Plan, 'id' | 'is_active' | 'created_at'> & {
  class_group_allowances: Array<{
    class_group_id: string;
    max_classes?: number | null;
  }>;
};
export type UpdatePlanPayload = Partial<CreatePlanPayload>;

export interface TaxType {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  current_percentage?: number | null;
  created_at: string;
  updated_at: string;
}
