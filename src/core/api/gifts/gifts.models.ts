export enum GiftOrderStatus {
  PENDING_PAYMENT = 'pending_payment',
  PENDING_CLAIM = 'pending_claim',
  CLAIMED = 'claimed',
  EXPIRED = 'expired',
}

export interface GiftClaimPreview {
  plan_name: string;
  recipient_name: string;
  message: string | null;
  is_anonymous: boolean;
  sender_display_name: string | null;
  claim_deadline: string;
  status: GiftOrderStatus;
}

export interface GiftClaimRequest {
  token: string;
}

export interface GiftClaimResponse {
  gift_order_id: string;
  subscription_id: string;
  status: GiftOrderStatus;
  plan_name: string;
  start_date: string;
}

export interface GiftListItem {
  id: string;
  plan_name: string;
  recipient_name: string;
  recipient_email: string;
  message: string | null;
  is_anonymous: boolean;
  sender_display_name: string | null;
  status: GiftOrderStatus;
  claim_deadline: string | null;
  claimed_at: string | null;
  created_at: string;
  can_claim: boolean;
}
