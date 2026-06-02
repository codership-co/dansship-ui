export interface GetPlansParams {
  is_active?: boolean;
}

export interface GetDiscountsParams {
  is_active?: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  classes_included: number;
  validity_days: number;
  is_active: boolean;
  created_at: string;
}

export type CreatePlanPayload = Omit<Plan, 'id' | 'is_active' | 'created_at'>;
export type UpdatePlanPayload = Partial<CreatePlanPayload>;

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
