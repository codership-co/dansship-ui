export enum PaymentMethod {
  TRANSFER = 'transfer',
  CARD = 'card',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  PENDING_MANUAL_REVIEW = 'pending_manual_review',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export type PurchaseType = 'plan' | 'merch' | 'workshop' | 'event' | 'private_class' | 'studio_rental' | (string & {});

export enum PaymentProofContentType {
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  WEBP = 'image/webp',
}
export const PaymentProofContentTypesList = Object.values(PaymentProofContentType);

export interface CreatePaymentIntentPayload {
  plan_id: string;
  payment_method_type: PaymentMethod;
  discount_code?: string;
  referral_code?: string;
  start_date?: string;
  is_gift?: boolean;
  gift_recipient_name?: string;
  gift_recipient_email?: string;
  gift_message?: string;
  gift_is_anonymous?: boolean;
  gift_sender_display_name?: string;
  is_duo?: boolean;
  duo_partner_email?: string;
}

export interface BoldCheckoutConfig {
  order_id: string;
  currency: string;
  amount: string;
  api_key: string;
  integrity_signature: string;
  description: string;
  redirection_url: string;
  render_mode: 'embedded';
  customer_data?: string | null;
}

export interface BoldCheckoutBootstrapResponse {
  intent: PaymentIntent;
  checkout: BoldCheckoutConfig;
}

export interface PaymentProofUploadRequest {
  content_type: PaymentProofContentType;
}

export interface ConfirmPaymentProofPayload {
  file_key: string;
}

export interface AdminPaymentReviewPayload {
  action: 'approve' | 'reject';
  admin_notes?: string;
}

export interface BoldFallbackSyncResponse {
  intent: PaymentIntent;
  outcome: string;
  event_type?: string | null;
  bold_payment_id?: string | null;
  notifications_count: number;
  message: string;
}

export interface PaymentEntityReference {
  id: string;
  name?: string | null;
  human_identifier?: string | null;
}

export interface PaymentIntent {
  id: string;
  user_id: string;
  amount: number;
  wallet_amount_applied?: number;
  currency: string;
  purchase_type: PurchaseType;
  reference_id: string;
  payment_method_type: PaymentMethod;
  status: PaymentStatus;
  gateway_provider: string | null;
  gateway_reference: string | null;
  proof_url: string | null;
  subscription_id: string | null;
  tax_type_name_snapshot?: string | null;
  tax_rate_percentage_snapshot?: number | null;
  tax_amount?: number | null;
  base_amount?: number | null;
  metadata: Record<string, unknown> | null;
  is_gift?: boolean;
  gift_recipient_email?: string | null;
  is_duo?: boolean;
  duo_partner_email?: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  user?: PaymentEntityReference | null;
  reviewer?: PaymentEntityReference | null;
  purchase_reference?: PaymentEntityReference | null;
  subscription?: PaymentEntityReference | null;
}

export interface GetAdminPaymentsParams {
  status?: PaymentStatus;
  purchase_type?: PurchaseType;
  user_id?: string;
}

export interface PaymentIntentDetail extends PaymentIntent {
  discount_code: string | null;
  plan_name?: string | null;
  referral_code?: string | null;
}

export interface PresignedUrlResponse {
  upload_url: string;
  file_key: string;
}

export interface ProofViewUrlResponse {
  view_url: string;
  expires_in: number;
}

export interface AdminPaymentListResponse {
  items: Array<PaymentIntent>;
  total: number;
}

export interface PaymentPreviewRequest {
  purchase_type?: PurchaseType;
  plan_id?: string;
  discount_code?: string;
  referral_code?: string;
  is_gift?: boolean;
  gift_recipient_email?: string;
  is_duo?: boolean;
  duo_partner_email?: string;
  room_id?: string;
  resource_id?: string | null;
  start_time?: string;
  end_time?: string;
  duration_hours?: number | string;
  payment_option?: 'full' | 'fifty_fifty';
}

export interface PaymentPreviewResponse {
  base_amount: string;
  discount_applied: boolean;
  discount_type: 'percentage_discount' | 'fixed_discount' | 'percentage' | 'fixed_amount' | null;
  discount_value: string | null;
  final_price: string;
  is_valid: boolean;
  original_price: string;
  rejection_reason: string | null;
  tax_amount: string;
  tax_rate_percentage: string;
  tax_type_name: string;
  bonus_classes_granted?: number | null;
  bonus_expires_days?: number | null;
  bonus_benefit_name?: string | null;
  discount_benefit_code?: string | null;
  is_first_plan_purchase?: boolean;
  wallet_amount_applied?: string;
  amount_to_charge?: string;
  payment_option?: 'full' | 'fifty_fifty';
  deposit_amount?: string | null;
  balance_amount?: string | null;
}

export interface PaymentPreviewMappedResponse {
  base_amount: number;
  discount_applied: boolean;
  discount_type: 'percentage_discount' | 'fixed_discount' | 'percentage' | 'fixed_amount' | null;
  discount_value: number;
  final_price: number;
  is_valid: boolean;
  original_price: number;
  rejection_reason: string | null;
  tax_amount: number;
  tax_rate_percentage: number;
  tax_type_name: string;
  bonus_classes_granted: number | null;
  bonus_expires_days: number | null;
  bonus_benefit_name: string | null;
  discount_benefit_code: string | null;
  is_first_plan_purchase: boolean;
  wallet_amount_applied: number;
  amount_to_charge: number;
  payment_option: 'full' | 'fifty_fifty';
  deposit_amount: number | null;
  balance_amount: number | null;
}
