export interface GetPlansParams {
  is_active?: boolean;
}

export interface GetDiscountsParams {
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

export interface Discount {
  id: string;
  name: string;
  code: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  description?: string;
  expiration_date?: string;
  usage_limit_global?: number;
  usage_limit_per_user?: number;
  is_active: boolean;
  created_at: string;
}

export type CreateDiscountPayload = Omit<Discount, 'id' | 'is_active' | 'created_at'>;
export type UpdateDiscountPayload = Partial<CreateDiscountPayload>;
