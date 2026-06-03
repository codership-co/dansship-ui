export type RentalRequestStatus = 'draft' | 'pending_payment' | 'pending_approval' | 'confirmed' | 'cancelled';

export type RentalRequestType = 'studio_rental' | 'private_class' | 'workshop' | 'internal_reserved_use';
export type RentalPurpose = 'self_practice' | 'private_class' | 'workshop' | 'internal_reserved_use';
export type RentalRoleType = 'internal_instructor' | 'external_user';
export type RentalResourceType = 'room' | 'pole';

export interface RentalSlot {
  id: string;
  room_id: string;
  resource_type: RentalResourceType;
  resource_id?: string | null;
  start_time: string;
  end_time: string;
  price: string;
}

export interface GetAvailabilityParams {
  room_id: string;
  start_at: string;
  end_at: string;
}

export interface RentalRequest {
  id: string;
  user_id: string;
  type: RentalRequestType;
  purpose: RentalPurpose;
  role_type: RentalRoleType;
  status: RentalRequestStatus;
  total_price: string;
  currency: string;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
  slots: Array<RentalSlot>;
}

export interface RentalSlotCreate {
  room_id: string;
  resource_type?: RentalResourceType;
  resource_id?: string | null;
  start_time: string;
  end_time: string;
}

export interface CreateRentalRequestPayload {
  type?: RentalRequestType;
  purpose?: RentalPurpose;
  slots: Array<RentalSlotCreate>;
}

export interface AdminListRequestsPayload {
  status?: RentalRequestStatus;
}

export interface ListRulesParams {
  room_id: string;
}

export interface InternalReservedUseCreatePayload {
  slots: Array<RentalSlotCreate>;
}

export interface AdminListInternalReservedUsesParams {
  status?: RentalRequestStatus;
}

export interface AvailabilitySlot {
  room_id: string;
  start_time: string;
  end_time: string;
  base_price: string;
}

export interface StudioRentalRoomOption {
  id: string;
  name: string;
  capacity: number;
  room_type?: string | null;
  description?: string | null;
}

export interface AvailabilityRule {
  id: string;
  room_id: string;
  day_of_week?: number | null;
  start_time: string;
  end_time: string;
  rule_type: 'block' | 'allow';
  is_active: boolean;
  notes?: string | null;
}

export interface AvailabilityRulePayload {
  room_id: string;
  day_of_week?: number | null;
  start_time: string;
  end_time: string;
  rule_type?: 'block' | 'allow';
  is_active?: boolean;
  notes?: string | null;
}

export interface CancelRequestPayload {
  reason?: string;
}

export interface AdminRejectPayload {
  reason?: string;
}

export interface AdminCancelInternalReservedUsePayload {
  reason?: string;
}

export interface UpdateRulePayload extends Partial<AvailabilityRulePayload> {}
